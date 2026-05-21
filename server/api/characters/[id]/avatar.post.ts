import { eq } from 'drizzle-orm';
import { characters, useDb } from '../../../db';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const formData = await readMultipartFormData(event);
    if (!formData) throw createError({ statusCode: 400, message: 'No form data' });

    const find = (name: string) => formData.find((f) => f.name === name);

    const fileField = find('file');
    const adventureId = find('adventureId')?.data.toString();
    const systemId = find('systemId')?.data.toString();
    const password = find('password')?.data.toString();

    if (!fileField?.data || !adventureId || !systemId || !password) {
        throw createError({ statusCode: 400, message: 'Missing required fields' });
    }

    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const storagePath = `${systemId}/${adventureId}/characters/${id}/avatar.jpg`;

    const { error: uploadError } = await supabaseAdmin()
        .storage.from(STORAGE_BUCKET)
        .upload(storagePath, fileField.data, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) throw createError({ statusCode: 500, message: uploadError.message });

    const db = useDb();
    const rows = await db
        .update(characters)
        .set({ avatarPath: storagePath })
        .where(eq(characters.id, id))
        .returning();
    const character = rows[0];
    if (!character) throw createError({ statusCode: 404, message: 'Character not found' });

    return { character };
});
