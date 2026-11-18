import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { trackingCards, useDb } from '../../db';
import type { TrackingCardUpdatedPayload } from '#shared/types/sync';

const bodySchema = z.object({
    title: z.string().min(1).max(255).optional(),
    type: z.enum(['clue', 'juice', 'tag', 'status', 'score']).optional(),
    value: z.number().nullable().optional(),
    characterId: z.string().uuid().nullable().optional(),
    sortOrder: z.number().int().optional(),
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const body = await readBody(event);
    const { password, ...fields } = parseOrThrow(bodySchema, body);
    requireAuth(password);

    const patch: Partial<typeof trackingCards.$inferInsert> = {};
    if ('title' in fields && fields.title) patch.title = fields.title;
    if ('type' in fields && fields.type) patch.type = fields.type;
    if ('value' in fields) patch.value = fields.value ?? null;
    if ('characterId' in fields) patch.characterId = fields.characterId ?? null;
    if ('sortOrder' in fields && fields.sortOrder !== undefined) patch.sortOrder = fields.sortOrder;

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
