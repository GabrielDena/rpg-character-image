import { eq } from 'drizzle-orm';
import { systems, useDb } from '../../db';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const db = useDb();
    const rows = await db.select().from(systems).where(eq(systems.id, id));
    const system = rows[0];
    if (!system) throw createError({ statusCode: 404, message: 'System not found' });
    return { system };
});
