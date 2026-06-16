import {
    boolean,
    integer,
    json,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';

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

export const locations = pgTable('locations', {
    id: uuid('id').defaultRandom().primaryKey(),
    adventureId: uuid('adventure_id')
        .notNull()
        .references(() => adventures.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const backgrounds = pgTable('backgrounds', {
    id: uuid('id').defaultRandom().primaryKey(),
    adventureId: uuid('adventure_id')
        .notNull()
        .references(() => adventures.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    storagePath: text('storage_path').notNull(),
    altStoragePath: text('alt_storage_path'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const characters = pgTable('characters', {
    id: uuid('id').defaultRandom().primaryKey(),
    adventureId: uuid('adventure_id')
        .notNull()
        .references(() => adventures.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 3 }).notNull().default('npc'),
    playbook: varchar('playbook', { length: 255 }),
    description: text('description'),
    avatarPath: text('avatar_path'),
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
    activeItemIds: uuid('active_item_ids').array().default([]).notNull(),
    selectedBackgroundId: uuid('selected_background_id').references(() => backgrounds.id),
    galleryFitMode: text('gallery_fit_mode').default('cover').notNull(),
    displayMode: text('display_mode').default('scene').notNull(),
    tableShape: text('table_shape').default('round').notNull(),
    tableSeats: integer('table_seats').default(4).notNull(),
    seatAssignments: json('seat_assignments').$type<(string | null)[]>(),
    showCharacters: boolean('show_characters').default(true).notNull(),
    tableSideSeats: integer('table_side_seats').default(0).notNull(),
    useAltBackground: boolean('use_alt_background').default(false).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const savedScenes = pgTable('saved_scenes', {
    id: uuid('id').defaultRandom().primaryKey(),
    adventureId: uuid('adventure_id')
        .notNull()
        .references(() => adventures.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    characterIds: uuid('character_ids').array().default([]).notNull(),
    backgroundId: uuid('background_id').references(() => backgrounds.id, { onDelete: 'set null' }),
    displayMode: text('display_mode').default('scene').notNull(),
    tableShape: text('table_shape').default('round').notNull(),
    tableSeats: integer('table_seats').default(4).notNull(),
    tableSideSeats: integer('table_side_seats').default(0).notNull(),
    useAltBackground: boolean('use_alt_background').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type System = typeof systems.$inferSelect;
export type NewSystem = typeof systems.$inferInsert;

export type Adventure = typeof adventures.$inferSelect;
export type NewAdventure = typeof adventures.$inferInsert;

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

export type Background = typeof backgrounds.$inferSelect;
export type NewBackground = typeof backgrounds.$inferInsert;

export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;

export type CharacterImage = typeof characterImages.$inferSelect;
export type NewCharacterImage = typeof characterImages.$inferInsert;

export type DisplayState = typeof displayState.$inferSelect;

export type SavedSceneRow = typeof savedScenes.$inferSelect;
export type NewSavedScene = typeof savedScenes.$inferInsert;

export const itemCategories = pgTable('item_categories', {
    id: uuid('id').defaultRandom().primaryKey(),
    adventureId: uuid('adventure_id')
        .notNull()
        .references(() => adventures.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const items = pgTable('items', {
    id: uuid('id').defaultRandom().primaryKey(),
    adventureId: uuid('adventure_id')
        .notNull()
        .references(() => adventures.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => itemCategories.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    storagePath: text('storage_path'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ItemCategory = typeof itemCategories.$inferSelect;
export type NewItemCategory = typeof itemCategories.$inferInsert;

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
