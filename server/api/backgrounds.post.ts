import { backgrounds, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const formData = await readMultipartFormData(event);
    if (!formData) throw createError({ statusCode: 400, message: 'No form data' });

    const find = (name: string) => formData.find((f) => f.name === name);

    const fileField = find('file');
    const altFileField = find('altFile');
    const adventureId = find('adventureId')?.data.toString();
    const systemId = find('systemId')?.data.toString();
    const name = find('name')?.data.toString().trim();
    const password = find('password')?.data.toString();
    const locationIdRaw = find('locationId')?.data.toString();
    const locationId = locationIdRaw || null;

    if (!fileField?.data || !adventureId || !systemId || !name || !password) {
        throw createError({ statusCode: 400, message: 'Missing required fields' });
    }

    if (!checkPassword(password)) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    const ts = Date.now();
    const filename = `${ts}-${fileField.filename ?? 'background'}`;
    const storagePath = `${systemId}/${adventureId}/backgrounds/${filename}`;
    const contentType = fileField.type ?? 'image/jpeg';

    const { error: uploadError } = await supabaseAdmin()
        .storage.from(STORAGE_BUCKET)
        .upload(storagePath, fileField.data, { contentType });

    if (uploadError) throw createError({ statusCode: 500, message: uploadError.message });

    let altStoragePath: string | null = null;
    if (altFileField?.data) {
        const altFilename = `${ts}-alt-${altFileField.filename ?? 'background'}`;
        altStoragePath = `${systemId}/${adventureId}/backgrounds/${altFilename}`;
        const { error: altUploadError } = await supabaseAdmin()
            .storage.from(STORAGE_BUCKET)
            .upload(altStoragePath, altFileField.data, {
                contentType: altFileField.type ?? 'image/jpeg',
            });
        if (altUploadError) throw createError({ statusCode: 500, message: altUploadError.message });
    }

    const db = useDb();
    const rows = await db
        .insert(backgrounds)
        .values({ adventureId, locationId, name, storagePath, altStoragePath })
        .returning();
    const background = rows[0];
    if (!background) throw createError({ statusCode: 500, message: 'Failed to create record' });

    return {
        background: {
            ...background,
            url: getPublicUrl(background.storagePath),
            altUrl: background.altStoragePath ? getPublicUrl(background.altStoragePath) : null,
        },
    };
});
