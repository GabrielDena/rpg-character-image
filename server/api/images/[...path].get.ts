import { STORAGE_BUCKET } from '../../utils/constants';
import { supabaseAdmin } from '../../utils/supabaseAdmin';

export default defineEventHandler(async (event) => {
    const storagePath = getRouterParams(event).path as string;
    if (!storagePath) throw createError({ statusCode: 400, message: 'Path required' });

    const { data, error } = await supabaseAdmin().storage.from(STORAGE_BUCKET).download(storagePath);
    if (error || !data) throw createError({ statusCode: 404, message: 'Image not found' });

    const buffer = Buffer.from(await data.arrayBuffer());

    setResponseHeaders(event, {
        'Content-Type': data.type || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(buffer.byteLength),
    });

    return buffer;
});
