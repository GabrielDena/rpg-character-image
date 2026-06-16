import { eq } from 'drizzle-orm';
import { items, useDb } from '../../db';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const formData = await readMultipartFormData(event);
    if (!formData) throw createError({ statusCode: 400, message: 'No form data' });

    const find = (name: string) => formData.find((f) => f.name === name);

    const fileField = find('file');
    const name = find('name')?.data.toString().trim();
    const descriptionRaw = find('description')?.data.toString();
    const description = descriptionRaw !== undefined ? descriptionRaw.trim() || null : undefined;
    const categoryIdRaw = find('categoryId')?.data.toString();
    const categoryId = categoryIdRaw !== undefined ? categoryIdRaw || null : undefined;
    const clearImage = find('clearImage')?.data.toString() === 'true';
    const password = find('password')?.data.toString();
    const systemId = find('systemId')?.data.toString();
    const adventureId = find('adventureId')?.data.toString();

    if (!name || !password) {
        throw createError({ statusCode: 400, message: 'Missing required fields' });
    }

    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const existing = await db.select().from(items).where(eq(items.id, id));
    const current = existing[0];
    if (!current) throw createError({ statusCode: 404, message: 'Item not found' });

    let storagePath = current.storagePath;

    if (clearImage && storagePath) {
        await supabaseAdmin().storage.from(STORAGE_BUCKET).remove([storagePath]);
        storagePath = null;
    } else if (fileField?.data && systemId && adventureId) {
        if (storagePath) {
            await supabaseAdmin().storage.from(STORAGE_BUCKET).remove([storagePath]);
        }
        const ts = Date.now();
        const filename = `${ts}-${fileField.filename ?? 'item'}`;
        storagePath = `${systemId}/${adventureId}/items/${filename}`;
        const { error: uploadError } = await supabaseAdmin()
            .storage.from(STORAGE_BUCKET)
            .upload(storagePath, fileField.data, { contentType: fileField.type ?? 'image/jpeg' });
        if (uploadError) throw createError({ statusCode: 500, message: uploadError.message });
    }

    const rows = await db
        .update(items)
        .set({
            name,
            description: description !== undefined ? description : current.description,
            categoryId: categoryId !== undefined ? categoryId : current.categoryId,
            storagePath,
        })
        .where(eq(items.id, id))
        .returning();
    const item = rows[0];
    if (!item) throw createError({ statusCode: 500, message: 'Failed to update item' });

    return {
        item: {
            ...item,
            url: item.storagePath ? getPublicUrl(item.storagePath) : null,
        },
    };
});
