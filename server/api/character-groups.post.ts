import { z } from 'zod';
import { characterGroups, useDb } from '../db';

const bodySchema = z.object({
    adventureId: z.string().uuid(),
    name: z.string().min(1).max(255),
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'Invalid input' });
    }

    const { adventureId, name, password } = parsed.data;
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db.insert(characterGroups).values({ adventureId, name }).returning();
    const group = rows[0];
    if (!group) throw createError({ statusCode: 500, message: 'Failed to create group' });

    return { group: { ...group, memberIds: [] } };
});
