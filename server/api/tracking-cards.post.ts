import { trackingCards, useDb } from '../db';
import type { TrackingCardUpdatedPayload } from '#shared/types/sync';

export default defineEventHandler(async (event) => {
    const body = await readBody<{
        adventureId: string;
        title: string;
        type: string;
        value?: number | null;
        characterId?: string | null;
        password: string;
    }>(event);

    if (!checkPassword(body?.password)) throw createError({ statusCode: 401, message: 'Unauthorized' });
    if (!body.adventureId || !body.title || !body.type) {
        throw createError({ statusCode: 400, message: 'Missing required fields' });
    }

    const db = useDb();
    const rows = await db
        .insert(trackingCards)
        .values({ adventureId: body.adventureId, title: body.title, type: body.type, value: body.value ?? null, characterId: body.characterId ?? null })
        .returning();

    const card = rows[0];
    if (!card) throw createError({ statusCode: 500, message: 'Failed to create tracking card' });

    const payload: TrackingCardUpdatedPayload = { type: 'tracking-card-updated', data: { adventureId: body.adventureId } };
    broadcast(payload);

    return { trackingCard: card };
});
