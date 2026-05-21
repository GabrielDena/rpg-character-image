import { desc, eq } from 'drizzle-orm';
import { backgrounds, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const { adventureId } = getQuery(event);
    if (!adventureId || typeof adventureId !== 'string') {
        throw createError({ statusCode: 400, message: 'adventureId is required' });
    }

    const db = useDb();
    const rows = await db
        .select()
        .from(backgrounds)
        .where(eq(backgrounds.adventureId, adventureId))
        .orderBy(desc(backgrounds.createdAt));

    const paths = rows.map((bg) => bg.storagePath);
    const signedUrls =
        paths.length > 0
            ? (
                  await supabaseAdmin()
                      .storage.from(STORAGE_BUCKET)
                      .createSignedUrls(paths, 3600)
              ).data ?? []
            : [];

    const urlMap = Object.fromEntries(signedUrls.map((s) => [s.path, s.signedUrl]));

    return {
        backgrounds: rows.map((bg) => ({
            ...bg,
            url: urlMap[bg.storagePath] ?? null,
        })),
    };
});
