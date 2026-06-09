import { desc } from 'drizzle-orm';
import { systems, useDb } from '../db';

export default defineEventHandler(async () => {
    const db = useDb();
    const result = await db.select().from(systems).orderBy(desc(systems.createdAt));
    return { systems: result };
});
