import { z } from 'zod';
import { locations, useDb } from '../db';

const bodySchema = z.object({
    adventureId: z.string().uuid(),
    name: z.string().min(1, 'Name is required').max(255),
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { adventureId, name, password } = parseOrThrow(bodySchema, body);
    requireAuth(password);

    const db = useDb();
    const rows = await db.insert(locations).values({ adventureId, name }).returning();
    const location = rows[0];
    if (!location) throw createError({ statusCode: 500, message: 'Failed to create location' });

    return { location };
});
