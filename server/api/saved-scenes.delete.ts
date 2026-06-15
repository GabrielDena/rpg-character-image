import { eq } from 'drizzle-orm';
import { savedScenes, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const { adventureId, password } = await readBody(event);
    if (!adventureId || typeof adventureId !== 'string') {
        throw createError({ statusCode: 400, message: 'adventureId is required' });
    }
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    await db.delete(savedScenes).where(eq(savedScenes.adventureId, adventureId));

    broadcast({ type: 'scene-updated', data: { adventureId } });

    return { ok: true };
});
