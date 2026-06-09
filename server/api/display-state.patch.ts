import type { AdventurePayload, AltBackgroundToggledPayload } from '#shared/types/sync';
import { eq } from 'drizzle-orm';
import { displayState, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const body = await readBody<{
        activeAdventureId?: string | null;
        activeCharacterIds?: string[];
        selectedBackgroundId?: string | null;
        galleryFitMode?: 'cover' | 'contain';
        displayMode?: 'scene' | 'table';
        tableShape?: 'round' | 'square' | 'rectangle';
        tableSeats?: number;
        tableSideSeats?: number;
        seatAssignments?: (string | null)[] | null;
        showCharacters?: boolean;
        useAltBackground?: boolean;
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
    if ('galleryFitMode' in body && body.galleryFitMode) patch.galleryFitMode = body.galleryFitMode;
    if ('displayMode' in body && body.displayMode) patch.displayMode = body.displayMode;
    if ('tableShape' in body && body.tableShape) patch.tableShape = body.tableShape;
    if ('tableSeats' in body && body.tableSeats != null) patch.tableSeats = body.tableSeats;
    if ('tableSideSeats' in body && body.tableSideSeats != null)
        patch.tableSideSeats = body.tableSideSeats;
    if ('seatAssignments' in body) patch.seatAssignments = body.seatAssignments ?? null;
    if ('showCharacters' in body && body.showCharacters != null)
        patch.showCharacters = body.showCharacters;
    if ('useAltBackground' in body && body.useAltBackground != null)
        patch.useAltBackground = body.useAltBackground;

    if (rows.length === 0) {
        await db.insert(displayState).values({
            activeAdventureId: body.activeAdventureId ?? null,
            activeCharacterIds: body.activeCharacterIds ?? [],
        });
    } else {
        await db.update(displayState).set(patch).where(eq(displayState.id, rows[0]!.id));
    }

    if ('useAltBackground' in body && Object.keys(patch).length === 2) {
        // Only useAltBackground changed — broadcast targeted payload to avoid full refetch
        const payload: AltBackgroundToggledPayload = {
            type: 'alt-background-toggled',
            data: { useAltBackground: body.useAltBackground ? 'true' : 'false' },
        };
        broadcast(payload);
    } else {
        const payload: AdventurePayload = {
            type: 'adventure-updated',
            data: { activeAdventureId: body.activeAdventureId ?? null },
        };
        broadcast(payload);
    }

    return {
        activeAdventureId: body.activeAdventureId ?? null,
        activeCharacterIds: body.activeCharacterIds ?? [],
    };
});
