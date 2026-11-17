# Code Review — Readability & Maintainability

**Project:** rpg-character-image (Nuxt 3 · Drizzle ORM · Supabase)  
**Date:** 2026-11-16  
**Scope:** Full source review — 8 categories, 36 findings

---

## Table of Contents

1. [Type Safety](#1-type-safety) — 8 findings
2. [Code Duplication](#2-code-duplication) — 8 findings
3. [Component Complexity](#3-component-complexity) — 4 findings
4. [API Layer](#4-api-layer) — 7 findings
5. [State Management](#5-state-management) — 3 findings
6. [Naming & Clarity](#6-naming--clarity) — 7 findings
7. [Dead Code / Unused](#7-dead-code--unused) — 4 findings
8. [Missing Abstractions](#8-missing-abstractions) — 6 findings

---

## 1. Type Safety

**1.** **`server/plugins/catch-unhandled.ts:2,11`** — `reason: any` and `err: any` in process handlers.  
→ Use `unknown` and narrow with `(reason as NodeJS.ErrnoException)?.code`.

**2.** **`server/api/tracking-cards.post.ts:8` / `[id].patch.ts:9`** — `type: string` in the inline body types instead of `TrackingCardType`.  
Values like `'poison'` silently reach the DB with no type error.  
→ Import `TrackingCardType` from `#shared/types/models` and use it in the inline body shape.

**3.** **`server/api/tracking-cards.get.ts:6`** — `query.adventureId as string` cast without null/type check.  
Every other GET handler guards with `if (!adventureId || typeof adventureId !== 'string')`.  
→ Align this handler to the same guard pattern.

**4.** **`shared/types/models.ts:30` / `app/types/character.ts:7`** — `Character.type: string` should be `'pc' | 'npc'`.  
Downstream code like `formType.value = (c.type as 'pc' | 'npc') ?? 'npc'` in `CharacterCreateModal.vue:128` only exists because the type is too wide.  
→ Narrow the shared model to the `'pc' | 'npc'` union; remove the downstream casts.

**5.** **`server/api/images/[...path].get.ts:5`** — `getRouterParams(event).path as string` without an undefined check.  
`path` can be `undefined`; the cast hides it.  
→ Add `if (!storagePath) throw createError({ statusCode: 400 })` before use.

**6.** **`app/composables/useSyncSocket.ts:27`** — `(message as any).type` in the `default` branch.  
The union is exhaustive; the cast buys nothing.  
→ Remove the cast; add a `never` exhaustiveness check to catch future message types at compile time.

**7.** **`server/api/display-state.get.ts:62–65, 100–103, 207–210`** — Three identical inline casts for `galleryFitMode` and similar fields across three early-return branches.  
The DB column type (`text`) doesn't match the domain type, so each branch re-casts the same values.  
→ Use `pgEnum` for these columns in the schema, or cast once in a shared mapper. See §8.

**8.** **`shared/types/sync.ts:48`** — `useAltBackground: string // 'true' | 'false'` — boolean serialized as string.  
`BasePayload.data` is `Record<string, string | string[] | null>`, forcing boolean fields to be stringly-typed.  
→ Relax `BasePayload.data` to `Record<string, unknown>`; let subtypes declare proper field types.

---

## 2. Code Duplication

**1.** **~25 `server/api` handlers** — Auth check copy-pasted into every mutating handler.  
`if (!checkPassword(...)) throw createError({ statusCode: 401, message: 'Unauthorized' })` appears verbatim in every POST/PATCH/DELETE route.  
→ Extract `requireAuth(password: string): void` to `server/utils/auth.ts`. Each handler becomes a one-liner.

**2.** **~15 `server/api` handlers** — Zod validation error thrown identically everywhere.  
`throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'Invalid input' })` after every Zod parse failure.  
→ Extract `parseOrThrow<T>(schema: ZodSchema<T>, body: unknown): T` to `server/utils/validation.ts`.

**3.** **`backgrounds.post.ts` · `backgrounds/[id].patch.ts` · `items.post.ts` · `items/[id].patch.ts` · `character-images.post.ts` · `characters/[id]/avatar.post.ts`** — Inline `findField` helper defined in 6 multipart handlers.  
`const find = (name) => formData.find((f) => f.name === name)` re-defined in each upload handler.  
→ Move to `server/utils/formData.ts` as an exported `findField(formData, name)`.

**4.** **`backgrounds.get.ts` · `backgrounds.post.ts` · `backgrounds/[id].patch.ts`** — Background URL mapping repeated in every background response.  
`{ ...bg, url: getPublicUrl(bg.storagePath), altUrl: ... }` assembled by hand in three places.  
→ Extract `toBackgroundWithUrls(bg)` mapper to `server/utils/mappers.ts`.

**5.** **`items.get.ts` · `items.post.ts` · `items/[id].patch.ts`** — Item URL mapping repeated in every item response.  
`{ ...item, url: item.storagePath ? getPublicUrl(...) : null }` in three handlers.  
→ Extract `toItemWithUrl(item)` alongside the background mapper.

**6.** **`server/api/display-state.get.ts` — three branches** — Display response object constructed manually (~30 fields) in each early-return branch.  
The second branch is missing `activeItemIds` and other fields present in the full branch, producing an inconsistent response shape.  
→ Extract `buildDisplayResponse(state, overrides?)` and call it from all three branches.

**7.** **`app/pages/session.vue:188–345`** — Five nearly identical toggle functions for display-state fields.  
`toggleShowItems`, `toggleShowTrackingCards`, `toggleShowCharacters`, `toggleFitMode`, `toggleBgFitMode` each: toggle a boolean, PATCH one field, update local ref, set a saving flag.  
→ Extract a generic `patchDisplayField(field, localRef, savingRef)` helper or a `useDisplayField()` composable.

**8.** **`session.vue` · `CharacterCreateModal.vue` · `display.vue`** — `getPassword()` / `localStorage.getItem('app_password')` as a local function in multiple files.  
→ Extract to a shared `usePassword()` composable in `app/composables/`.

---

## 3. Component Complexity

**1.** **`app/pages/session.vue` — 715 lines** — Single page component owns 11+ orthogonal state domains.  
Active adventure, characters, backgrounds, locations, items, display mode, fit modes, table config, tracking cards, hidden IDs, and WS sync reconciliation all live in one file.  
→ Split into composables: `useSessionAdventure()`, `useSessionCharacters()`, `useSessionDisplay()`, `useSessionItems()`, `useSessionTrackingCards()`. The page component becomes orchestration only.

**2.** **`app/pages/display.vue` — 1200 lines** — Combines state fetching, SVG layout math, scene transitions, seat drag interactions, tracking card rendering, and items overlay.  
→ Extract `useSceneTransition()`, `useTableLayout(state)`, `useSeatInteraction()` composables; extract `DisplayTable.vue` from the SVG block.

**3.** **`app/components/CharacterCreateModal.vue`** — Single modal handles creation, editing, deletion, avatar crop, gallery upload, remove-background, set-default, delete image, and inline group creation.  
The image management section alone is a full feature.  
→ Extract `CharacterImageManager.vue` for the existing-images / upload-new-images section. The parent modal becomes a form wrapper.

**4.** **`app/components/SessionDisplayPanel.vue:1–36`** — 14 props and 9 emitted events covering three unrelated concerns.  
Visibility toggles, fit modes, and table/scene mode switching all threaded through the same component.  
→ Group into a single `displayConfig` object prop + `update:displayConfig` emit, or split into focused sub-panels.

---

## 4. API Layer

**1.** **`server/api/adventures/[id].delete.ts:8–9`** — `systemId` taken from body without validation.  
If missing, the storage folder path becomes `undefined/${id}/` and the `list()` call silently returns nothing — files are not deleted.  
→ Validate with Zod and throw 400 if absent. Or derive `systemId` from the already-fetched `adventure` row (line 13) and drop the body param entirely.

**2.** **`server/api/tracking-cards.post.ts:14–17`** — Manual field presence check instead of Zod schema.  
`if (!body.adventureId || !body.title || !body.type)` skips type coercion and validation messages. Every other POST handler uses a Zod schema.  
→ Add a Zod schema consistent with the rest of the POST handlers.

**3.** **`server/api/tracking-cards/[id].patch.ts:6` / `[id].delete.ts:6`** — `getRouterParam(event, 'id')!` non-null assertion without a 400 guard.  
All other `[id]` handlers check `if (!id) throw createError(400, ...)`. These two skip it.  
→ Add the guard to match the rest of the codebase.

**4.** **`server/api/display-state.patch.ts:5–27`** — Large inline `readBody<{...}>()` type with no Zod validation.  
A body like `{ tableSeats: "four" }` silently reaches Drizzle and causes a runtime error.  
→ Apply a Zod schema consistent with the rest of the PATCH handlers.

**5.** **`server/api/saved-scenes.delete.ts:5`** — `adventureId` and `password` read from body without schema.  
Inconsistent with every other DELETE handler in the project.  
→ Add a Zod schema.

**6.** **`server/api/backgrounds/[id].patch.ts:34`** — `background.storagePath.split('/backgrounds/')[0]` to derive a path prefix.  
Brittle: breaks silently if the storage path shape ever changes.  
→ Accept `systemId` / `adventureId` in the form data, or join the `backgrounds` table to its adventure to get these IDs directly.

**7.** **`server/api/tracking-cards/[id].delete.ts:13`** — `const adventureId = rows[0]?.adventureId ?? ''` silently broadcasts an empty adventureId.  
When the card isn't found, `rows` is empty and an empty-string adventureId propagates to the broadcast.  
→ Throw 404 if `rows.length === 0`.

---

## 5. State Management

**1.** **`app/stores/app.ts` vs `app/pages/session.vue`** — `altBackground` flows in both directions, risking sync loops.  
`session.vue` calls `store.setAltBackground()` on user action, then watches `store.altBackground` to receive it back from WS — a two-way binding.  
→ Own `altBackground` in exactly one place: either fully in the store (session page reads and writes it there) or fully on the page (store just broadcasts, page reconciles).

**2.** **`app/stores/app.ts:2–5`** — Four separate version counters with identical `notify*()` functions.  
`notifyDisplay()`, `notifyDisplayTransition()`, `notifyScenes()`, `notifyTrackingCards()` each do `value++`.  
→ Use a single `notify(channel: 'display' | 'display-transition' | 'scenes' | 'tracking-cards')` action, or use VueUse's `useEventBus`.

**3.** **`app/pages/session.vue:479–525`** — WS sync watcher manually copies 15+ fields from the API response to individual refs.  
Any new display-state field must be plumbed through this watcher manually.  
→ Extract `applyDisplayState(state)` and call it from both `onMounted` and the watcher, so there's a single place to update.

---

## 6. Naming & Clarity

**1.** **`app/pages/session.vue:14`** — `const show = ref(true)` — unclear what it controls.  
→ Rename to `showPanelContent`, or let the panel manage its own open state (see §7).

**2.** **`server/db/schema.ts:58`** — `type: varchar('type', { length: 3 })` — constraint invisible from the type.  
Length 3 fits `'npc'` but documents nothing about the domain.  
→ Use `pgEnum('character_type', ['pc', 'npc'])` — self-documenting and enforced at the DB level.

**3.** **`server/api/display-state.patch.ts:70`** — `Object.keys(patch).length === 2` magic number.  
The `2` means "only `updatedAt` and `useAltBackground` were patched" but nothing in the code says so.  
→ Collect user-initiated fields explicitly and check `userFields.size === 0`.

**4.** **`app/pages/display.vue:83`** — `containerWidth.value > 1980` — likely a typo for 1920.  
1980 is not a standard breakpoint; 1920 (1080p) almost certainly is.  
→ `const WIDESCREEN_BREAKPOINT = 1920` and compare against that.

**5.** **`app/pages/display.vue:179–181`** — `COVER_DURATION`, `REVEAL_DURATION`, `PRELOAD_BUFFER` — no units in name.  
→ Rename to `COVER_DURATION_MS`, `REVEAL_DURATION_MS`, `PRELOAD_BUFFER_MS`.

**6.** **`app/components/AdventureCharactersTab.vue:24`** — `sort` ref holds both sort orders and type filters.  
A single ref carrying `'pc' | 'npc' | 'asc' | 'desc'` blurs two independent concerns.  
→ Split into `typeFilter: Ref<'all' | 'pc' | 'npc'>` and `sortOrder: Ref<'asc' | 'desc'>`.

**7.** **`shared/types/models.ts` vs `server/db/schema.ts`** — Hand-written interfaces duplicate Drizzle-inferred types and are already drifting.  
`Background` in `models.ts` is missing `altStoragePath` which exists in the schema.  
→ Re-export `typeof backgrounds.$inferSelect` from the schema file; delete the hand-written duplicates. (Also listed in §8.)

---

## 7. Dead Code / Unused

**1.** **`server/api/display-state.get.ts:13`** — Explicit import of `getPublicUrl` — only file that doesn't use Nitro auto-import.  
→ Remove the import for consistency with every other server file.

**2.** **`app/pages/session.vue:14`** — `const show = ref(true)` passed down but never read back in the parent.  
The ref is passed as `v-model` to two panels, but the panels toggle it internally and `session.vue` never reads the value.  
→ Remove from the page; let each panel manage its own open state.

**3.** **`nuxt.config.ts:24–27`** — Supabase credentials in `runtimeConfig.public` — no client-side Supabase code exists.  
All Supabase calls go through `supabaseAdmin()` which is server-only. Putting credentials in `public` exposes them in the client bundle unnecessarily.  
→ Move to `runtimeConfig` (server-only) or remove if unused.

**4.** **`server/api/adventures/[id].delete.ts:8`** — `systemId` taken from request body when it's already on the fetched DB row.  
Line 13 fetches the adventure record which already has `adventure.systemId`.  
→ Derive from the DB record and remove the body parameter.

---

## 8. Missing Abstractions

**1.** **All mutating `server/api` handlers** — No server-side auth middleware — every endpoint duplicates the check.  
A developer adding a new endpoint can forget the check and silently create an unauthenticated route.  
→ Add a Nitro route middleware or a `withAuth(handler)` wrapper. The auth check becomes declarative and impossible to omit.

**2.** **`server/api/characters.get.ts` · `character-groups.get.ts`** — Duplicate "join table → map → merge" pattern for group membership.  
Both handlers implement the same logic to build a `groupId → characterIds[]` map.  
→ Extract `buildGroupMemberMap()` to `server/utils/groupMembers.ts`.

**3.** **`backgrounds.post.ts` · `items.post.ts` · `characters/[id]/avatar.post.ts` · `character-images.post.ts`** — Supabase `storage.upload()` + error handling repeated in 4 handlers.  
→ Extract `uploadToStorage(path, data, contentType)` to the existing `server/utils/storage.ts`.

**4.** **`app/pages/session.vue` + `display.vue`** — Both pages fetch `/api/display-state` and assign the result to local state with no shared type.  
The response shape is an inline anonymous type duplicated in both files.  
→ Extract a `useDisplayState()` composable with a named `DisplayStateResponse` type in `app/composables/`.

**5.** **`shared/types/models.ts` vs `server/db/schema.ts`** — Domain types defined twice (schema-inferred and hand-written) and already drifting.  
`Background` in `models.ts` is missing `altStoragePath` that exists in the schema.  
→ Re-export `typeof table.$inferSelect` (and `$inferInsert` where needed) from the schema file. Import them in `shared/types/models.ts` or remove that file entirely.

**6.** **`server/api/display-state.get.ts` — 228 lines** — Single God handler: fetch, join, reconcile, and assemble display state.  
One handler does: singleton row fetch, adventure+system join, character fetch, profile image fetch, item fetch, background fetch, tracking card fetch, card character fetch, seat reconciliation, and response assembly.  
→ Break into private async functions: `resolveActiveCharacters()`, `resolveActiveItems()`, `resolveSelectedBackground()`, `resolveTrackingCards()`. The handler orchestrates; each function is independently testable.

---

## Priority Summary

| Priority | Findings |
| --- | --- |
| ~~**Fix now** (correctness risk)~~ ✅ Done (commit `77ee7b7`) | ~~2.6 (inconsistent display response shape)~~, ~~4.1 (systemId missing silently)~~, ~~4.7 (empty adventureId broadcast)~~, ~~7.3 (Supabase key in public config)~~ |
| **High value** (reduce future bugs) | 1.2–1.4 (narrow types), 2.1–2.2 (auth + Zod helpers), 8.1 (auth middleware), 8.5 (stop duplicating schema types) |
| **Good cleanup** | 3.1–3.2 (split large components), 5.3 (applyDisplayState), 2.7 (patchDisplayField), 6.2 (pgEnum) |
| **Minor polish** | 6.4–6.5 (naming), 7.1–7.2 (dead refs/imports), 5.2 (notify channels) |
