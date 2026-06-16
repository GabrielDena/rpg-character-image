import { items, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const formData = await readMultipartFormData(event);
    if (!formData) throw createError({ statusCode: 400, message: 'No form data' });

    const find = (name: string) => formData.find((f) => f.name === name);

    const fileField = find('file');
    const adventureId = find('adventureId')?.data.toString();
    const systemId = find('systemId')?.data.toString();
    const name = find('name')?.data.toString().trim();
    const description = find('description')?.data.toString().trim() || null;
    const categoryId = find('categoryId')?.data.toString() || null;
    const password = find('password')?.data.toString();

    if (!adventureId || !systemId || !name || !password) {
        throw createError({ statusCode: 400, message: 'Missing required fields' });
    }

    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    let storagePath: string | null = null;
    if (fileField?.data) {
        const ts = Date.now();
        const filename = `${ts}-${fileField.filename ?? 'item'}`;
        storagePath = `${systemId}/${adventureId}/items/${filename}`;
        const { error: uploadError } = await supabaseAdmin()
            .storage.from(STORAGE_BUCKET)
            .upload(storagePath, fileField.data, { contentType: fileField.type ?? 'image/jpeg' });
        if (uploadError) throw createError({ statusCode: 500, message: uploadError.message });
    }

    const db = useDb();
    const rows = await db
        .insert(items)
        .values({ adventureId, categoryId, name, description, storagePath })
        .returning();
    const item = rows[0];
    if (!item) throw createError({ statusCode: 500, message: 'Failed to create item' });

    return {
        item: {
            ...item,
            url: item.storagePath ? getPublicUrl(item.storagePath) : null,
        },
    };
});
