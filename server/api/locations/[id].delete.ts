import { eq } from 'drizzle-orm';
import { locations, useDb } from '../../db';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const { password } = await readBody(event);
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db.select().from(locations).where(eq(locations.id, id));
    if (!rows[0]) throw createError({ statusCode: 404, message: 'Location not found' });

    await db.delete(locations).where(eq(locations.id, id));

    return { ok: true };
});
