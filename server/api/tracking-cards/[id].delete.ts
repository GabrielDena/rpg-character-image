import { eq } from 'drizzle-orm';
import { trackingCards, useDb } from '../../db';
import type { AdventurePayload } from '#shared/types/sync';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')!;
    const body = await readBody<{ password: string }>(event);

    if (!checkPassword(body?.password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    await db.delete(trackingCards).where(eq(trackingCards.id, id));

    const payload: AdventurePayload = { type: 'adventure-updated', data: { activeAdventureId: null } };
    broadcast(payload);

    return { ok: true };
});
