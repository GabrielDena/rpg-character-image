import { eq } from 'drizzle-orm';
import { trackingCards, useDb } from '../../db';
import type { TrackingCardUpdatedPayload } from '#shared/types/sync';

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id')!;
    const body = await readBody<{
        title?: string;
        type?: string;
        value?: number | null;
        sortOrder?: number;
        password: string;
    }>(event);

    if (!checkPassword(body?.password)) throw createError({ statusCode: 401, message: 'Unauthorized' });

    const patch: Partial<typeof trackingCards.$inferInsert> = {};
    if ('title' in body && body.title) patch.title = body.title;
    if ('type' in body && body.type) patch.type = body.type;
    if ('value' in body) patch.value = body.value ?? null;
    if ('sortOrder' in body && body.sortOrder !== undefined) patch.sortOrder = body.sortOrder;

    const db = useDb();
    const rows = await db
        .update(trackingCards)
        .set(patch)
        .where(eq(trackingCards.id, id))
        .returning();

    const card = rows[0];
    if (!card) throw createError({ statusCode: 404, message: 'Tracking card not found' });

    const payload: TrackingCardUpdatedPayload = { type: 'tracking-card-updated', data: { adventureId: card.adventureId } };
    broadcast(payload);

    return { trackingCard: card };
});
