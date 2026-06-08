# Background–Location Relation Design

**Date:** 2026-06-07
**Status:** Approved

## Overview

Add an optional location association to backgrounds. Background creation and editing move to a modal that supports image upload, name, and location selection. The backgrounds list gains a location badge per item and a location filter.

## Schema

Add a nullable `location_id` FK to the `backgrounds` table:

```ts
locationId: uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),
```

Run `drizzle-kit generate` then `drizzle-kit migrate`.

Update the `Background` interface in `shared/types/models.ts`:

```ts
locationId: string | null;
```

## API Changes

### `backgrounds.post.ts`

Accept an optional `locationId` form field alongside the existing fields and pass it to the insert.

### `backgrounds/[id].patch.ts`

Change from JSON body to multipart to support optional image replacement:

- Always accept: `name`, `locationId` (nullable), `password`
- Optionally accept: `file` (new image)
- If a new file is provided: upload it to Supabase, delete the old `storagePath`, update `storagePath` in the DB row
- If no file: leave `storagePath` unchanged

### `backgrounds.get.ts`

No change — all columns are already returned.

## New Component: `BackgroundCreateEditModal.vue`

Props:
- `open: boolean`
- `adventureId: string`
- `systemId: string`
- `background?: BackgroundWithUrl | null` (edit mode when present)
- `locations: Location[]` (passed in from tab, already loaded)

Emits: `update:open`, `created`, `updated`

Form fields:
- **Image**: shows current thumbnail in edit mode or empty state. "Choose image" button opens file input (single file, image/*). Selected file shown as preview.
- **Name**: text input, pre-filled in edit mode.
- **Location**: select dropdown with options: "None" + each location by name. Pre-selected in edit mode.

On save:
- Build a `FormData` with `name`, `adventureId`, `systemId`, `password`, optional `locationId`, optional `file`
- POST `/api/backgrounds` (create) or PATCH `/api/backgrounds/[id]` (edit)
- Emit `created` or `updated` on success

## Updated: `AdventureBackgroundsTab.vue`

Changes to `AdventureBackgroundsTab.vue`:

- **Add button**: replace "Upload" (multi-file input) with "Add Background" button that opens `BackgroundCreateEditModal` in create mode
- **Edit**: pencil icon opens `BackgroundCreateEditModal` in edit mode (passing the background as prop)
- **Location badge**: each list item shows a small badge with the location name if `locationId` is set
- **Location filter**: dropdown above the list with options: "All" / each location name / "No location". Applied to the `filtered` computed alongside the search query. Locations for the dropdown are fetched from `/api/locations?adventureId=` when the tab mounts.

## Data Flow

```
AdventureBackgroundsTab
  ├── fetches backgrounds (with locationId)
  ├── fetches locations (for filter dropdown + modal)
  ├── BackgroundCreateEditModal (open for create or edit)
  │     receives locations prop
  │     POSTs or PATCHes backgrounds API
  │     emits created → tab appends new background to list
  │     emits updated → tab updates the matching item in list in place
  └── location filter + search filter applied to rendered list
```
