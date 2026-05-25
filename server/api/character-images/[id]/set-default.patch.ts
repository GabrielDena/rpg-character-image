import type { CharacterUpdatedPayload } from '#shared/types/sync';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { characterImages, useDb } from '../../../db';

const bodySchema = z.object({
    characterId: z.string().uuid(),
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const body = await readBody(event);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const { characterId, password } = parsed.data;
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();

    await db
        .update(characterImages)
        .set({ isProfile: false })
        .where(eq(characterImages.characterId, characterId));

    const rows = await db
        .update(characterImages)
        .set({ isProfile: true })
        .where(eq(characterImages.id, id))
        .returning();
    const image = rows[0];
    if (!image) throw createError({ statusCode: 404, message: 'Image not found' });

    const payload: CharacterUpdatedPayload = { type: 'character-updated', data: { characterId } };
    broadcast(payload);

    return { image };
});
