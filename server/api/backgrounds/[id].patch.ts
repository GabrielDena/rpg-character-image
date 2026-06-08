import { eq } from 'drizzle-orm';
import { backgrounds, useDb } from '../../db';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const formData = await readMultipartFormData(event);
    if (!formData) throw createError({ statusCode: 400, message: 'No form data' });

    const find = (name: string) => formData.find((f) => f.name === name);

    const name = find('name')?.data.toString().trim();
    const password = find('password')?.data.toString();
    const locationIdRaw = find('locationId')?.data.toString();
    const locationId = locationIdRaw === '' ? null : (locationIdRaw ?? null);
    const fileField = find('file');

    if (!name || !password) {
        throw createError({ statusCode: 400, message: 'Missing required fields' });
    }

    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();

    const existing = await db.select().from(backgrounds).where(eq(backgrounds.id, id));
    const background = existing[0];
    if (!background) throw createError({ statusCode: 404, message: 'Background not found' });

    let storagePath = background.storagePath;

    if (fileField?.data) {
        const pathPrefix = background.storagePath.split('/backgrounds/')[0];
        const filename = `${Date.now()}-${fileField.filename ?? 'background'}`;
        const newPath = `${pathPrefix}/backgrounds/${filename}`;
        const contentType = fileField.type ?? 'image/jpeg';

        const { error: uploadError } = await supabaseAdmin()
            .storage.from(STORAGE_BUCKET)
            .upload(newPath, fileField.data, { contentType });

        if (uploadError) throw createError({ statusCode: 500, message: uploadError.message });

        await supabaseAdmin().storage.from(STORAGE_BUCKET).remove([background.storagePath]);
        storagePath = newPath;
    }

    const rows = await db
        .update(backgrounds)
        .set({ name, locationId, storagePath })
        .where(eq(backgrounds.id, id))
        .returning();

    return { background: { ...rows[0], url: getPublicUrl(rows[0]!.storagePath) } };
});
