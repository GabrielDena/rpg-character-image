import { z } from 'zod';
import { savedScenes, useDb } from '../db';

const bodySchema = z.object({
    adventureId: z.string().uuid(),
    name: z.string().min(1).max(255),
    characterIds: z.array(z.string().uuid()).default([]),
    backgroundId: z.string().uuid().nullable().default(null),
    displayMode: z.enum(['scene', 'table']).default('scene'),
    tableShape: z.enum(['round', 'square', 'rectangle']).default('round'),
    tableSeats: z.number().int().min(2).max(8).default(4),
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? 'Invalid input',
        });
    }

    const { password, ...fields } = parsed.data;
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db.insert(savedScenes).values(fields).returning();
    const scene = rows[0];
    if (!scene) throw createError({ statusCode: 500, message: 'Failed to create scene' });

    broadcast({ type: 'scene-updated', data: { adventureId: scene.adventureId } });

    return { scene };
});

