import { asc, eq } from 'drizzle-orm';
import { locations, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const { adventureId } = getQuery(event);
    if (!adventureId || typeof adventureId !== 'string') {
        throw createError({ statusCode: 400, message: 'adventureId is required' });
    }

    const db = useDb();
    const rows = await db
        .select()
        .from(locations)
        .where(eq(locations.adventureId, adventureId))
        .orderBy(asc(locations.name));

    return { locations: rows };
});
