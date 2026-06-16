import { asc, eq } from 'drizzle-orm';
import { items, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const { adventureId } = getQuery(event);
    if (!adventureId || typeof adventureId !== 'string') {
        throw createError({ statusCode: 400, message: 'adventureId is required' });
    }

    const db = useDb();
    const rows = await db
        .select()
        .from(items)
        .where(eq(items.adventureId, adventureId))
        .orderBy(asc(items.name));

    return {
        items: rows.map((item) => ({
            ...item,
            url: item.storagePath ? getPublicUrl(item.storagePath) : null,
        })),
    };
});
