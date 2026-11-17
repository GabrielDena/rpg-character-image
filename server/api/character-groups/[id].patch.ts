import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { characterGroups, useDb } from '../../db';

const bodySchema = z.object({
    name: z.string().min(1).max(255),
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
        .update(characterGroups)
        .set({ name })
        .where(eq(characterGroups.id, id))
        .returning();
    const group = rows[0];
    if (!group) throw createError({ statusCode: 404, message: 'Group not found' });

    return { group };
});
