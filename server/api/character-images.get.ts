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

    const { data } = await supabaseAdmin()
        .storage.from(STORAGE_BUCKET)
        .createSignedUrls(rows.map((r) => r.storagePath), 3600);

    const urlMap = new Map<string, string>();
    data?.forEach((item, i) => {
        const row = rows[i];
        if (row && item.signedUrl) urlMap.set(row.id, item.signedUrl);
    });

    return { images: rows.map((r) => ({ ...r, url: urlMap.get(r.id) ?? null })) };
});
