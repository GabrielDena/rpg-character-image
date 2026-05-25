import { eq } from 'drizzle-orm';
import { backgrounds, useDb } from '../../db';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const { password } = await readBody(event);
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db.select().from(backgrounds).where(eq(backgrounds.id, id));
    const background = rows[0];
    if (!background) throw createError({ statusCode: 404, message: 'Background not found' });

    await supabaseAdmin().storage.from(STORAGE_BUCKET).remove([background.storagePath]);

    await db.delete(backgrounds).where(eq(backgrounds.id, id));

    return { ok: true };
});
