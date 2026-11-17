import { z } from 'zod';
import { adventures, useDb } from '../db';

const bodySchema = z.object({
    systemId: z.string().uuid(),
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(1000).optional(),
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { systemId, name, description, password } = parseOrThrow(bodySchema, body);

    requireAuth(password);

    const db = useDb();
    const rows = await db.insert(adventures).values({ systemId, name, description }).returning();
    const adventure = rows[0];
    if (!adventure) throw createError({ statusCode: 500, message: 'Failed to create adventure' });

    const folderPath = `${systemId}/${adventure.id}/.keep`;
    const { error } = await supabaseAdmin()
        .storage.from(STORAGE_BUCKET)
        .upload(folderPath, new Blob([''], { type: 'text/plain' }), { upsert: true });

    if (error) {
        console.warn('[adventures] Could not create storage folder:', error.message);
    }

    return { adventure };
});
