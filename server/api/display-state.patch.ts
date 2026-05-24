import type { AdventurePayload } from '#shared/types/sync';
import { eq } from 'drizzle-orm';
import { displayState, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const body = await readBody<{
        activeAdventureId?: string | null;
        activeCharacterIds?: string[];
        selectedBackgroundId?: string | null;
        password: string;
    }>(event);

    if (!checkPassword(body?.password))
        throw createError({ statusCode: 401, message: 'Unauthorized' });

    const db = useDb();
    const rows = await db.select().from(displayState).limit(1);

    const patch: Partial<typeof displayState.$inferInsert> = { updatedAt: new Date() };
    if ('activeAdventureId' in body) patch.activeAdventureId = body.activeAdventureId ?? null;
    if ('activeCharacterIds' in body) patch.activeCharacterIds = body.activeCharacterIds ?? [];
    if ('selectedBackgroundId' in body)
        patch.selectedBackgroundId = body.selectedBackgroundId ?? null;

    if (rows.length === 0) {
        await db.insert(displayState).values({
            activeAdventureId: body.activeAdventureId ?? null,
            activeCharacterIds: body.activeCharacterIds ?? [],
        });
    } else {
        await db.update(displayState).set(patch).where(eq(displayState.id, rows[0]!.id));
    }

    const payload: AdventurePayload = {
        type: 'adventure-updated',
        data: { activeAdventureId: body.activeAdventureId ?? null },
    };
    broadcast(payload);

    return {
        activeAdventureId: body.activeAdventureId ?? null,
        activeCharacterIds: body.activeCharacterIds ?? [],
    };
});

