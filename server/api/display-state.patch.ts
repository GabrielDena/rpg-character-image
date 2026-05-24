import { eq } from 'drizzle-orm';
import { displayState, useDb } from '../db';
import type { AdventurePayload } from '#shared/types/sync';

export default defineEventHandler(async (event) => {
    const body = await readBody<{ activeAdventureId: string | null; password: string }>(event);

    if (!checkPassword(body?.password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db.select().from(displayState).limit(1);

    if (rows.length === 0) {
        await db.insert(displayState).values({ activeAdventureId: body.activeAdventureId ?? null });
    } else {
        await db.update(displayState).set({ activeAdventureId: body.activeAdventureId ?? null, updatedAt: new Date() }).where(eq(displayState.id, rows[0]!.id));
    }

    const payload: AdventurePayload = {
        type: 'adventure-updated',
        data: { activeAdventureId: body.activeAdventureId ?? null },
    };
    broadcast(payload);

    return { activeAdventureId: body.activeAdventureId ?? null };
});
