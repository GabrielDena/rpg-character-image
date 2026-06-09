import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { savedScenes, useDb } from '../../db';

const bodySchema = z.object({
    name: z.string().min(1).max(255),
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const body = await readBody(event);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? 'Invalid input',
        });
    }

    const { password, name } = parsed.data;
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db
        .update(savedScenes)
        .set({ name })
        .where(eq(savedScenes.id, id))
        .returning();
    const scene = rows[0];
    if (!scene) throw createError({ statusCode: 404, message: 'Scene not found' });

    broadcast({ type: 'scene-updated', data: { adventureId: scene.adventureId } });

    return { scene };
});
