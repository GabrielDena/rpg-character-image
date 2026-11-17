import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { characterGroups, useDb } from '../../db';

const bodySchema = z.object({
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const body = await readBody(event);
    const { password } = parseOrThrow(bodySchema, body);
    requireAuth(password);

    const db = useDb();
    const rows = await db.delete(characterGroups).where(eq(characterGroups.id, id)).returning();
    if (!rows.length) throw createError({ statusCode: 404, message: 'Group not found' });

    return { ok: true };
});
