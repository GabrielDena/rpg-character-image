import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { itemCategories, useDb } from '../../db';

const bodySchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const body = await readBody(event);
    const { name, password } = parseOrThrow(bodySchema, body);
    requireAuth(password);

    const db = useDb();
    const rows = await db
        .update(itemCategories)
        .set({ name })
        .where(eq(itemCategories.id, id))
        .returning();
    const category = rows[0];
    if (!category) throw createError({ statusCode: 404, message: 'Category not found' });

    return { category };
});
