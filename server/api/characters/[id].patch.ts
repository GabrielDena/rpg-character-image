import type { CharacterUpdatedPayload } from '#shared/types/sync';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { characters, useDb } from '../../db';

const bodySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    type: z.enum(['pc', 'npc']).optional(),
    playbook: z.string().max(255).nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
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

    const { password, ...fields } = parsed.data;
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db.update(characters).set(fields).where(eq(characters.id, id)).returning();
    const character = rows[0];
    if (!character) throw createError({ statusCode: 404, message: 'Character not found' });

    const payload: CharacterUpdatedPayload = {
        type: 'character-updated',
        data: { characterId: id },
    };
    broadcast(payload);

    return { character };
});
