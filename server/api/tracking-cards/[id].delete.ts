import { eq } from 'drizzle-orm';
import { trackingCards, useDb } from '../../db';
import type { TrackingCardUpdatedPayload } from '#shared/types/sync';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const body = await readBody<{ password: string }>(event);
    requireAuth(body?.password);

    const db = useDb();
    const rows = await db.delete(trackingCards).where(eq(trackingCards.id, id)).returning();
    if (!rows.length) throw createError({ statusCode: 404, message: 'Tracking card not found' });

    const adventureId = rows[0]!.adventureId;

    const payload: TrackingCardUpdatedPayload = { type: 'tracking-card-updated', data: { adventureId } };
    broadcast(payload);

    return { ok: true };
});
