import { asc, eq } from 'drizzle-orm';
import { itemCategories, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const { adventureId } = getQuery(event);
    if (!adventureId || typeof adventureId !== 'string') {
        throw createError({ statusCode: 400, message: 'adventureId is required' });
    }

    const db = useDb();
    const rows = await db
        .select()
        .from(itemCategories)
        .where(eq(itemCategories.adventureId, adventureId))
        .orderBy(asc(itemCategories.name));

    return { categories: rows };
});
