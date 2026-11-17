import { z } from 'zod';
import { characterGroups, useDb } from '../db';

const bodySchema = z.object({
    adventureId: z.string().uuid(),
    name: z.string().min(1).max(255),
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { adventureId, name, password } = parseOrThrow(bodySchema, body);
    requireAuth(password);

    const db = useDb();
    const rows = await db.insert(characterGroups).values({ adventureId, name }).returning();
    const group = rows[0];
    if (!group) throw createError({ statusCode: 500, message: 'Failed to create group' });

    return { group: { ...group, memberIds: [] } };
});
