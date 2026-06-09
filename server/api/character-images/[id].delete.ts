import type { CharacterUpdatedPayload } from '#shared/types/sync';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { characterImages, useDb } from '../../db';

const bodySchema = z.object({ password: z.string() });

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const body = await readBody(event);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) throw createError({ statusCode: 400, message: 'Invalid input' });
    if (!checkPassword(parsed.data.password))
        throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db.delete(characterImages).where(eq(characterImages.id, id)).returning();
    const image = rows[0];
    if (!image) throw createError({ statusCode: 404, message: 'Image not found' });

    await supabaseAdmin().storage.from(STORAGE_BUCKET).remove([image.storagePath]);

    const payload: CharacterUpdatedPayload = {
        type: 'character-updated',
        data: { characterId: image.characterId },
    };
    broadcast(payload);

    return { success: true };
});
