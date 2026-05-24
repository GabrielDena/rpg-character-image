import { eq } from 'drizzle-orm';
import { adventures, displayState, systems, useDb } from '../db';

export default defineEventHandler(async () => {
    const db = useDb();
    const rows = await db.select().from(displayState).limit(1);
    if (!rows.length || !rows[0]!.activeAdventureId) {
        return { activeAdventureId: null, adventure: null, system: null };
    }

    const adventureRows = await db
        .select({ adventure: adventures, system: systems })
        .from(adventures)
        .innerJoin(systems, eq(adventures.systemId, systems.id))
        .where(eq(adventures.id, rows[0]!.activeAdventureId))
        .limit(1);

    if (!adventureRows.length) {
        return { activeAdventureId: null, adventure: null, system: null };
    }

    return {
        activeAdventureId: rows[0]!.activeAdventureId,
        adventure: adventureRows[0]!.adventure,
        system: adventureRows[0]!.system,
    };
});
