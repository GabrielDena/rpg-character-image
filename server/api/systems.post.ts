import { z } from 'zod';
import { systems, useDb } from '../db';

const bodySchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(1000).optional(),
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

    const { name, description, password } = parsed.data;

    if (!checkPassword(password)) {
        throw createError({ statusCode: 401, message: 'Unauthorized' });
    }

    const db = useDb();
    const rows = await db.insert(systems).values({ name, description }).returning();
    const system = rows[0];
    if (!system) throw createError({ statusCode: 500, message: 'Failed to create system' });

    const folderPath = `${system.id}/.keep`;
    const { error } = await supabaseAdmin()
        .storage.from(STORAGE_BUCKET)
        .upload(folderPath, new Blob([''], { type: 'text/plain' }), { upsert: true });

    if (error) {
        console.warn('[systems] Could not create storage folder:', error.message);
    }

    return { system };
});

