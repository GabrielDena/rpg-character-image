import { eq } from 'drizzle-orm';
import { locations, useDb } from '../../db';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const { password } = await readBody(event);
    requireAuth(password);

    const db = useDb();
    const rows = await db.select().from(locations).where(eq(locations.id, id));
    if (!rows[0]) throw createError({ statusCode: 404, message: 'Location not found' });

    await db.delete(locations).where(eq(locations.id, id));

    return { ok: true };
});
