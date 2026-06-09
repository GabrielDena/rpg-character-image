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
    const altFileField = find('altFile');
    const clearAlt = find('clearAlt')?.data.toString() === 'true';

    if (!name || !password) {
        throw createError({ statusCode: 400, message: 'Missing required fields' });
    }

    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();

    const existing = await db.select().from(backgrounds).where(eq(backgrounds.id, id));
    const background = existing[0];
    if (!background) throw createError({ statusCode: 404, message: 'Background not found' });

    const ts = Date.now();
    const pathPrefix = background.storagePath.split('/backgrounds/')[0];

    let storagePath = background.storagePath;
    if (fileField?.data) {
        const filename = `${ts}-${fileField.filename ?? 'background'}`;
        const newPath = `${pathPrefix}/backgrounds/${filename}`;
        const { error: uploadError } = await supabaseAdmin()
            .storage.from(STORAGE_BUCKET)
            .upload(newPath, fileField.data, { contentType: fileField.type ?? 'image/jpeg' });
        if (uploadError) throw createError({ statusCode: 500, message: uploadError.message });
        await supabaseAdmin().storage.from(STORAGE_BUCKET).remove([background.storagePath]);
        storagePath = newPath;
    }

    let altStoragePath = background.altStoragePath;
    if (clearAlt) {
        if (background.altStoragePath) {
            await supabaseAdmin().storage.from(STORAGE_BUCKET).remove([background.altStoragePath]);
        }
        altStoragePath = null;
    } else if (altFileField?.data) {
        const altFilename = `${ts}-alt-${altFileField.filename ?? 'background'}`;
        const newAltPath = `${pathPrefix}/backgrounds/${altFilename}`;
        const { error: altUploadError } = await supabaseAdmin()
            .storage.from(STORAGE_BUCKET)
            .upload(newAltPath, altFileField.data, {
                contentType: altFileField.type ?? 'image/jpeg',
            });
        if (altUploadError) throw createError({ statusCode: 500, message: altUploadError.message });
        if (background.altStoragePath) {
            await supabaseAdmin().storage.from(STORAGE_BUCKET).remove([background.altStoragePath]);
        }
        altStoragePath = newAltPath;
    }

    const rows = await db
        .update(backgrounds)
        .set({ name, locationId, storagePath, altStoragePath })
        .where(eq(backgrounds.id, id))
        .returning();

    const updated = rows[0]!;
    return {
        background: {
            ...updated,
            url: getPublicUrl(updated.storagePath),
            altUrl: updated.altStoragePath ? getPublicUrl(updated.altStoragePath) : null,
        },
    };
});
