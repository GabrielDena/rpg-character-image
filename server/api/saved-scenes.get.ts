import { asc, eq } from 'drizzle-orm';
import { savedScenes, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const { adventureId } = getQuery(event);
    if (!adventureId || typeof adventureId !== 'string') {
        throw createError({ statusCode: 400, message: 'adventureId is required' });
    }

    const db = useDb();
    const rows = await db
        .select()
        .from(savedScenes)
        .where(eq(savedScenes.adventureId, adventureId))
        .orderBy(asc(savedScenes.createdAt));

    return { scenes: rows };
});

