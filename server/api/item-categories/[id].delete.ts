import { eq } from 'drizzle-orm';
import { itemCategories, useDb } from '../../db';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const { password } = await readBody(event);
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db.select().from(itemCategories).where(eq(itemCategories.id, id));
    if (!rows[0]) throw createError({ statusCode: 404, message: 'Category not found' });

    await db.delete(itemCategories).where(eq(itemCategories.id, id));

    return { ok: true };
});
