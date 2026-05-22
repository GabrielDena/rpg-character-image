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

    const withAvatars = rows.filter((c) => c.avatarPath);
    const avatarUrls = new Map<string, string>();

    if (withAvatars.length > 0) {
        const { data } = await supabaseAdmin()
            .storage.from(STORAGE_BUCKET)
            .createSignedUrls(
                withAvatars.map((c) => c.avatarPath!),
                3600
            );
        data?.forEach((item, i) => {
            const char = withAvatars[i];
            if (char && item.signedUrl) avatarUrls.set(char.id, item.signedUrl);
        });
    }

    return {
        characters: rows.map((c) => ({ ...c, avatarUrl: avatarUrls.get(c.id) ?? null })),
    };
});
