import { desc, eq } from 'drizzle-orm';
import { adventures, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const { systemId } = getQuery(event);
    if (!systemId || typeof systemId !== 'string') {
        throw createError({ statusCode: 400, message: 'systemId is required' });
    }

    const db = useDb();
    const result = await db
        .select()
        .from(adventures)
        .where(eq(adventures.systemId, systemId))
        .orderBy(desc(adventures.createdAt));
    return { adventures: result };
});
