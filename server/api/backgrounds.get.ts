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

    return {
        backgrounds: rows.map((bg) => ({
            ...bg,
            url: `/api/images/${bg.storagePath}`,
        })),
    };
});
