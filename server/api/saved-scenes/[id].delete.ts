import { eq } from 'drizzle-orm';
import { savedScenes, useDb } from '../../db';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const { password } = await readBody(event);
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db.select().from(savedScenes).where(eq(savedScenes.id, id));
    if (!rows[0]) throw createError({ statusCode: 404, message: 'Scene not found' });

    await db.delete(savedScenes).where(eq(savedScenes.id, id));

    broadcast({ type: 'scene-updated', data: { adventureId: rows[0].adventureId } });

    return { ok: true };
});

