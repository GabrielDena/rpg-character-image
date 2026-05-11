import { checkPassword } from '../../utils/auth';
import { STORAGE_BUCKET } from '../../utils/constants';
import { supabaseAdmin } from '../../utils/supabaseAdmin';
import { broadcast } from '../../utils/broadcast';

export default defineEventHandler(async (event) => {
    const { password, path } = await readBody<{ password: string; path: string }>(event);

    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Incorrect password' });
    if (!path) throw createError({ statusCode: 400, message: 'Path is required' });

    const { data, error } = await supabaseAdmin().storage.from(STORAGE_BUCKET).createSignedUploadUrl(path);

    if (error) throw createError({ statusCode: 500, message: error.message });

    const folder = path.substring(0, path.lastIndexOf('/')) || path;
    broadcast({ type: 'image-uploaded', data: { folder } });

    return data;
});

