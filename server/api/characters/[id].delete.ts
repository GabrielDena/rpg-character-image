import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { characterImages, characters, useDb } from '../../db';

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

    const charRows = await db.select().from(characters).where(eq(characters.id, id));
    const character = charRows[0];
    if (!character) throw createError({ statusCode: 404, message: 'Character not found' });

    const images = await db
        .select()
        .from(characterImages)
        .where(eq(characterImages.characterId, id));

    const pathsToRemove: string[] = [];
    if (character.avatarPath) pathsToRemove.push(character.avatarPath);
    pathsToRemove.push(...images.map((i) => i.storagePath));

    if (pathsToRemove.length > 0) {
        await supabaseAdmin().storage.from(STORAGE_BUCKET).remove(pathsToRemove);
    }

    await db.delete(characters).where(eq(characters.id, id));

    return { ok: true };
});
