import { eq, inArray } from 'drizzle-orm';
import { adventures, backgrounds, characters, displayState, systems, useDb } from '../db';

export default defineEventHandler(async () => {
    const db = useDb();
    const rows = await db.select().from(displayState).limit(1);
    if (!rows.length || !rows[0]!.activeAdventureId) {
        return {
            activeAdventureId: null,
            adventure: null,
            system: null,
            activeCharacterIds: [],
            activeCharacters: [],
        };
    }

    const state = rows[0]!;

    const adventureRows = await db
        .select({ adventure: adventures, system: systems })
        .from(adventures)
        .innerJoin(systems, eq(adventures.systemId, systems.id))
        .where(eq(adventures.id, state.activeAdventureId!))
        .limit(1);

    if (!adventureRows.length) {
        return {
            activeAdventureId: null,
            adventure: null,
            system: null,
            activeCharacterIds: [],
            activeCharacters: [],
        };
    }

    const ids = state.activeCharacterIds ?? [];
    const activeCharacters = ids.length
        ? (await db.select().from(characters).where(inArray(characters.id, ids))).map((c) => ({
              ...c,
              avatarUrl: c.avatarPath ? `/api/images/${c.avatarPath}` : null,
          }))
        : [];

    const selectedBackground = state.selectedBackgroundId
        ? await db.select().from(backgrounds).where(eq(backgrounds.id, state.selectedBackgroundId))
        : null;

    return {
        activeAdventureId: state.activeAdventureId,
        adventure: adventureRows[0]!.adventure,
        system: adventureRows[0]!.system,
        activeCharacterIds: ids,
        activeCharacters,
        selectedBackground,
    };
});

