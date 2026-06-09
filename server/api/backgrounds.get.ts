import { asc, eq } from 'drizzle-orm';
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
        .orderBy(asc(backgrounds.name));

    return {
        backgrounds: rows.map((bg) => ({
            ...bg,
            url: getPublicUrl(bg.storagePath),
            altUrl: bg.altStoragePath ? getPublicUrl(bg.altStoragePath) : null,
        })),
    };
});
