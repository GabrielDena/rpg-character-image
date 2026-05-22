import { asc, eq } from 'drizzle-orm';
import { characters, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const { adventureId } = getQuery(event);
    if (!adventureId || typeof adventureId !== 'string') {
        throw createError({ statusCode: 400, message: 'adventureId is required' });
    }

    const db = useDb();
    const rows = await db
        .select()
        .from(characters)
        .where(eq(characters.adventureId, adventureId))
        .orderBy(asc(characters.createdAt));

    return {
        characters: rows.map((c) => ({ ...c, avatarUrl: c.avatarPath ? `/api/images/${c.avatarPath}` : null })),
    };
});
