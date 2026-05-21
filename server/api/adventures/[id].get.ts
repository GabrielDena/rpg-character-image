import { eq } from 'drizzle-orm';
import { adventures, useDb } from '../../db';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const db = useDb();
    const rows = await db.select().from(adventures).where(eq(adventures.id, id));
    const adventure = rows[0];
    if (!adventure) throw createError({ statusCode: 404, message: 'Adventure not found' });
    return { adventure };
});
