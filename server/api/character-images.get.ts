import { asc, eq } from 'drizzle-orm';
import { characterImages, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const { characterId } = getQuery(event);
    if (!characterId || typeof characterId !== 'string') {
        throw createError({ statusCode: 400, message: 'characterId is required' });
    }

    const db = useDb();
    const rows = await db
        .select()
        .from(characterImages)
        .where(eq(characterImages.characterId, characterId))
        .orderBy(asc(characterImages.createdAt));

    if (rows.length === 0) return { images: [] };

    return { images: rows.map((r) => ({ ...r, url: getPublicUrl(r.storagePath) })) };
});
