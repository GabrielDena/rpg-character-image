# Locations Feature Design

**Date:** 2026-06-07  
**Status:** Approved

## Overview

Add a Locations tab to the adventure detail page. A location is a named entity belonging to an adventure. Users can create, rename, and delete locations.

## Schema

Add a `locations` table to `server/db/schema.ts`:

```ts
export const locations = pgTable('locations', {
    id: uuid('id').defaultRandom().primaryKey(),
    adventureId: uuid('adventure_id')
        .notNull()
        .references(() => adventures.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
```

Add a `Location` interface to `shared/types/models.ts`:

```ts
export interface Location {
    id: string;
    adventureId: string;
    name: string;
    createdAt: Date;
}
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/locations?adventureId=` | List locations for an adventure |
| POST | `/api/locations` | Create a location `{ name, adventureId }` |
| PATCH | `/api/locations/[id]` | Rename a location `{ name }` |
| DELETE | `/api/locations/[id]` | Delete a location |

All routes follow the existing pattern (Drizzle queries, password auth via header for mutations).

## Migration

Run `drizzle-kit generate` then `drizzle-kit migrate` to produce and apply the migration SQL.

## UI

**`AdventureLocationsTab.vue`** — new component modeled after `AdventureBackgroundsTab.vue`:
- Search input to filter by name
- List of location cards with inline rename (same edit/save pattern as backgrounds) and delete button
- "Add location" button opens a simple name-input form (no modal needed, just an inline input at the top or bottom of the list)

**`[adventureId].vue`** — insert the locations tab between characters and backgrounds:
- Add `{ key: 'locations' as const, label: 'Locations', icon: 'i-heroicons-map-pin' }` to the `tabs` array
- Extend `activeTab` type to `'characters' | 'locations' | 'backgrounds'`
- Add `<AdventureLocationsTab v-show="activeTab === 'locations'" ... />` in the content section
