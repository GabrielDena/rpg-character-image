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
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? 'Invalid input',
        });
    }

    const { name, password } = parsed.data;
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

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
