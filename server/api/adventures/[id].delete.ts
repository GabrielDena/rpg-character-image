import { eq } from 'drizzle-orm';
import { adventures, useDb } from '../../db';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const { password, systemId } = await readBody(event);
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db.select().from(adventures).where(eq(adventures.id, id));
    const adventure = rows[0];
    if (!adventure) throw createError({ statusCode: 404, message: 'Adventure not found' });

    // Remove all files in the adventure's storage folder
    const folderPrefix = `${systemId}/${id}/`;
    const { data: fileList } = await supabaseAdmin()
        .storage.from(STORAGE_BUCKET)
        .list(`${systemId}/${id}`, { limit: 1000 });

    if (fileList && fileList.length > 0) {
        const paths = fileList.map((f) => `${folderPrefix}${f.name}`);
        await supabaseAdmin().storage.from(STORAGE_BUCKET).remove(paths);
    }

    await db.delete(adventures).where(eq(adventures.id, id));

    return { ok: true };
});
