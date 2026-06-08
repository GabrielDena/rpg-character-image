import { z } from 'zod';
import { locations, useDb } from '../db';

const bodySchema = z.object({
    adventureId: z.string().uuid(),
    name: z.string().min(1, 'Name is required').max(255),
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? 'Invalid input',
        });
    }

    const { adventureId, name, password } = parsed.data;
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db.insert(locations).values({ adventureId, name }).returning();
    const location = rows[0];
    if (!location) throw createError({ statusCode: 500, message: 'Failed to create location' });

    return { location };
});
