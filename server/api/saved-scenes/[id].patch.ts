import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { savedScenes, useDb } from '../../db';

const bodySchema = z.object({
    name: z.string().min(1).max(255),
    password: z.string(),
    characterIds: z.array(z.string()).optional(),
    backgroundId: z.string().nullable().optional(),
    useAltBackground: z.boolean().optional(),
    displayMode: z.enum(['scene', 'table']).optional(),
    tableShape: z.enum(['round', 'square', 'rectangle']).optional(),
    tableSeats: z.number().int().positive().optional(),
    tableSideSeats: z.number().int().min(0).optional(),
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

    const {
        password,
        name,
        characterIds,
        backgroundId,
        useAltBackground,
        displayMode,
        tableShape,
        tableSeats,
        tableSideSeats,
    } = parsed.data;
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db
        .update(savedScenes)
        .set({
            name,
            ...(characterIds !== undefined && { characterIds }),
            ...(backgroundId !== undefined && { backgroundId }),
            ...(useAltBackground !== undefined && { useAltBackground }),
            ...(displayMode !== undefined && { displayMode }),
            ...(tableShape !== undefined && { tableShape }),
            ...(tableSeats !== undefined && { tableSeats }),
            ...(tableSideSeats !== undefined && { tableSideSeats }),
        })
        .where(eq(savedScenes.id, id))
        .returning();
    const scene = rows[0];
    if (!scene) throw createError({ statusCode: 404, message: 'Scene not found' });

    broadcast({ type: 'scene-updated', data: { adventureId: scene.adventureId } });

    return { scene };
});
