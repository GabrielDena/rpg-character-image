import { eq } from 'drizzle-orm';
import { trackingCards, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const adventureId = query.adventureId;
    if (typeof adventureId !== 'string') throw createError({ statusCode: 400, message: 'adventureId is required' });

    const db = useDb();
    const cards = await db
        .select()
        .from(trackingCards)
        .where(eq(trackingCards.adventureId, adventureId))
        .orderBy(trackingCards.sortOrder, trackingCards.createdAt);

    return { trackingCards: cards };
});
