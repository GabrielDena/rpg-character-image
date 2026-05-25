import { backgrounds, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const formData = await readMultipartFormData(event);
    if (!formData) throw createError({ statusCode: 400, message: 'No form data' });

    const find = (name: string) => formData.find((f) => f.name === name);

    const fileField = find('file');
    const adventureId = find('adventureId')?.data.toString();
    const systemId = find('systemId')?.data.toString();
    const name = find('name')?.data.toString().trim();
    const password = find('password')?.data.toString();

    if (!fileField?.data || !adventureId || !systemId || !name || !password) {
        throw createError({ statusCode: 400, message: 'Missing required fields' });
    }

    if (!checkPassword(password)) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    const filename = `${Date.now()}-${fileField.filename ?? 'background'}`;
    const storagePath = `${systemId}/${adventureId}/backgrounds/${filename}`;
    const contentType = fileField.type ?? 'image/jpeg';

    const { error: uploadError } = await supabaseAdmin()
        .storage.from(STORAGE_BUCKET)
        .upload(storagePath, fileField.data, { contentType });

    if (uploadError) throw createError({ statusCode: 500, message: uploadError.message });

    const db = useDb();
    const rows = await db.insert(backgrounds).values({ adventureId, name, storagePath }).returning();
    const background = rows[0];
    if (!background) throw createError({ statusCode: 500, message: 'Failed to create record' });

    return { background };
});
