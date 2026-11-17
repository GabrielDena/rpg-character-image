import { z } from 'zod';
import { trackingCards, useDb } from '../db';
import type { TrackingCardUpdatedPayload } from '#shared/types/sync';

const bodySchema = z.object({
    adventureId: z.string().uuid(),
    title: z.string().min(1).max(255),
    type: z.enum(['clue', 'juice', 'tag', 'status']),
    value: z.number().nullable().optional(),
    characterId: z.string().uuid().nullable().optional(),
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { adventureId, title, type, value, characterId, password } = parseOrThrow(bodySchema, body);
    requireAuth(password);

    const db = useDb();
    const rows = await db
        .insert(trackingCards)
        .values({ adventureId, title, type, value: value ?? null, characterId: characterId ?? null })
        .returning();

    const card = rows[0];
    if (!card) throw createError({ statusCode: 500, message: 'Failed to create tracking card' });

    const payload: TrackingCardUpdatedPayload = { type: 'tracking-card-updated', data: { adventureId } };
    broadcast(payload);

    return { trackingCard: card };
});
