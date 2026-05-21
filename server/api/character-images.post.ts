import { eq } from 'drizzle-orm';
import { characterImages, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const formData = await readMultipartFormData(event);
    if (!formData) throw createError({ statusCode: 400, message: 'No form data' });

    const find = (name: string) => formData.find((f) => f.name === name);

    const fileField = find('file');
    const characterId = find('characterId')?.data.toString();
    const adventureId = find('adventureId')?.data.toString();
    const systemId = find('systemId')?.data.toString();
    const isProfileStr = find('isProfile')?.data.toString();
    const password = find('password')?.data.toString();

    if (!fileField?.data || !characterId || !adventureId || !systemId || !password) {
        throw createError({ statusCode: 400, message: 'Missing required fields' });
    }

    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const isProfile = isProfileStr === 'true';
    const filename = `${Date.now()}-${fileField.filename ?? 'image'}`;
    const storagePath = `${systemId}/${adventureId}/characters/${characterId}/${filename}`;
    const contentType = fileField.type ?? 'image/jpeg';

    const { error: uploadError } = await supabaseAdmin()
        .storage.from(STORAGE_BUCKET)
        .upload(storagePath, fileField.data, { contentType });

    if (uploadError) throw createError({ statusCode: 500, message: uploadError.message });

    const db = useDb();

    if (isProfile) {
        await db
            .update(characterImages)
            .set({ isProfile: false })
            .where(eq(characterImages.characterId, characterId));
    }

    const rows = await db
        .insert(characterImages)
        .values({ characterId, storagePath, isProfile })
        .returning();
    const image = rows[0];
    if (!image) throw createError({ statusCode: 500, message: 'Failed to create record' });

    return { image };
});
