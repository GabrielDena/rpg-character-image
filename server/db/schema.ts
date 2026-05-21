import { boolean, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const systems = pgTable('systems', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const adventures = pgTable('adventures', {
    id: uuid('id').defaultRandom().primaryKey(),
    systemId: uuid('system_id')
        .notNull()
        .references(() => systems.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const backgrounds = pgTable('backgrounds', {
    id: uuid('id').defaultRandom().primaryKey(),
    adventureId: uuid('adventure_id')
        .notNull()
        .references(() => adventures.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    storagePath: text('storage_path').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const characters = pgTable('characters', {
    id: uuid('id').defaultRandom().primaryKey(),
    adventureId: uuid('adventure_id')
        .notNull()
        .references(() => adventures.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const characterImages = pgTable('character_images', {
    id: uuid('id').defaultRandom().primaryKey(),
    characterId: uuid('character_id')
        .notNull()
        .references(() => characters.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),
    isProfile: boolean('is_profile').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const displayState = pgTable('display_state', {
    id: uuid('id').defaultRandom().primaryKey(),
    activeAdventureId: uuid('active_adventure_id').references(() => adventures.id, {
        onDelete: 'set null',
    }),
    activeCharacterIds: uuid('active_character_ids').array().default([]).notNull(),
    selectedBackground: text('selected_background'),
    galleryFitMode: varchar('gallery_fit_mode', { length: 10 }).default('cover').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type System = typeof systems.$inferSelect;
export type NewSystem = typeof systems.$inferInsert;

export type Adventure = typeof adventures.$inferSelect;
export type NewAdventure = typeof adventures.$inferInsert;

export type Background = typeof backgrounds.$inferSelect;
export type NewBackground = typeof backgrounds.$inferInsert;

export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;

export type CharacterImage = typeof characterImages.$inferSelect;
export type NewCharacterImage = typeof characterImages.$inferInsert;

export type DisplayState = typeof displayState.$inferSelect;

