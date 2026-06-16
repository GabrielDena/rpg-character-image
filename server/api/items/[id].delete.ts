import { eq } from 'drizzle-orm';
import { items, useDb } from '../../db';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const { password } = await readBody(event);
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db.select().from(items).where(eq(items.id, id));
    const item = rows[0];
    if (!item) throw createError({ statusCode: 404, message: 'Item not found' });

    if (item.storagePath) {
        await supabaseAdmin().storage.from(STORAGE_BUCKET).remove([item.storagePath]);
    }

    await db.delete(items).where(eq(items.id, id));

    return { ok: true };
});
