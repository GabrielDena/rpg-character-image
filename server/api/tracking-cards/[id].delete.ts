import { eq } from 'drizzle-orm';
import { trackingCards, useDb } from '../../db';
import type { TrackingCardUpdatedPayload } from '#shared/types/sync';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')!;
    const body = await readBody<{ password: string }>(event);

    if (!checkPassword(body?.password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db.delete(trackingCards).where(eq(trackingCards.id, id)).returning();
    const adventureId = rows[0]?.adventureId ?? '';

    const payload: TrackingCardUpdatedPayload = { type: 'tracking-card-updated', data: { adventureId } };
    broadcast(payload);

    return { ok: true };
});
