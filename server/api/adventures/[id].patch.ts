import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { adventures, useDb } from '../../db';

const bodySchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(1000).optional().nullable(),
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const body = await readBody(event);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const { name, description, password } = parsed.data;
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db
        .update(adventures)
        .set({ name, description: description ?? null })
        .where(eq(adventures.id, id))
        .returning();

    const adventure = rows[0];
    if (!adventure) throw createError({ statusCode: 404, message: 'Adventure not found' });

    return { adventure };
});
