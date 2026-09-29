import { trackingCards, useDb } from '../db';
import type { AdventurePayload } from '#shared/types/sync';

export default defineEventHandler(async (event) => {
    const body = await readBody<{
        adventureId: string;
        title: string;
        type: string;
        password: string;
    }>(event);

    if (!checkPassword(body?.password)) throw createError({ statusCode: 401, message: 'Unauthorized' });
    if (!body.adventureId || !body.title || !body.type) {
        throw createError({ statusCode: 400, message: 'Missing required fields' });
    }

    const db = useDb();
    const rows = await db
        .insert(trackingCards)
        .values({ adventureId: body.adventureId, title: body.title, type: body.type })
        .returning();

    const card = rows[0];
    if (!card) throw createError({ statusCode: 500, message: 'Failed to create tracking card' });

    const payload: AdventurePayload = { type: 'adventure-updated', data: { activeAdventureId: null } };
    broadcast(payload);

    return { trackingCard: card };
});
