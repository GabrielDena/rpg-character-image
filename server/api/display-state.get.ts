import { and, eq, inArray } from 'drizzle-orm';
import {
    adventures,
    backgrounds,
    characterImages,
    characters,
    displayState,
    systems,
    useDb,
} from '../db';
import { getPublicUrl } from '../utils/storage';

function reconcileSeatAssignments(
    raw: (string | null)[] | null | undefined,
    activeIds: string[],
    seatCount: number
): (string | null)[] {
    const result: (string | null)[] = Array(seatCount).fill(null);
    const activeSet = new Set(activeIds);
    const placed = new Set<string>();

    const hasExplicitAssignments = raw && raw.some((id) => id !== null);

    if (hasExplicitAssignments) {
        // Trust stored assignments — null slots are intentional (character is standing)
        for (let i = 0; i < Math.min(seatCount, raw!.length); i++) {
            const id = raw![i];
            if (id && activeSet.has(id) && !placed.has(id)) {
                result[i] = id;
                placed.add(id);
            }
        }
    } else {
        // No assignments yet — auto-seat everyone in order
        for (const id of activeIds) {
            const slot = result.indexOf(null);
            if (slot !== -1) {
                result[slot] = id;
                placed.add(id);
            }
        }
    }

    return result;
}

export default defineEventHandler(async () => {
    const db = useDb();
    const rows = await db.select().from(displayState).limit(1);
    if (!rows.length || !rows[0]!.activeAdventureId) {
        return {
            activeAdventureId: null,
            adventure: null,
            system: null,
            activeCharacterIds: [],
            activeCharacters: [],
            selectedBackground: null,
            galleryFitMode: (rows[0]?.galleryFitMode ?? 'cover') as 'cover' | 'contain',
            displayMode: (rows[0]?.displayMode ?? 'scene') as 'scene' | 'table',
            tableShape: (rows[0]?.tableShape ?? 'round') as 'round' | 'square' | 'rectangle',
            tableSeats: rows[0]?.tableSeats ?? 4,
            tableSideSeats: rows[0]?.tableSideSeats ?? 0,
            seatAssignments: reconcileSeatAssignments(
                rows[0]?.seatAssignments,
                [],
                rows[0]?.tableSeats ?? 4
            ),
            showCharacters: rows[0]?.showCharacters ?? true,
        };
    }

    const state = rows[0]!;

    const adventureRows = await db
        .select({ adventure: adventures, system: systems })
        .from(adventures)
        .innerJoin(systems, eq(adventures.systemId, systems.id))
        .where(eq(adventures.id, state.activeAdventureId!))
        .limit(1);

    if (!adventureRows.length) {
        return {
            activeAdventureId: null,
            adventure: null,
            system: null,
            activeCharacterIds: [],
            activeCharacters: [],
            selectedBackground: null,
            galleryFitMode: (state.galleryFitMode ?? 'cover') as 'cover' | 'contain',
            displayMode: (state.displayMode ?? 'scene') as 'scene' | 'table',
            tableShape: (state.tableShape ?? 'round') as 'round' | 'square' | 'rectangle',
            tableSeats: state.tableSeats ?? 4,
            seatAssignments: reconcileSeatAssignments(
                state.seatAssignments,
                [],
                state.tableSeats ?? 4
            ),
            showCharacters: state.showCharacters ?? true,
        };
    }

    const ids = state.activeCharacterIds ?? [];

    const profileImages = ids.length
        ? await db
              .select()
              .from(characterImages)
              .where(
                  and(
                      inArray(characterImages.characterId, ids),
                      eq(characterImages.isProfile, true)
                  )
              )
        : [];

    const profileImageByCharacterId = Object.fromEntries(
        profileImages.map((img) => [img.characterId, getPublicUrl(img.storagePath)])
    );

    const activeCharacters = ids.length
        ? (await db.select().from(characters).where(inArray(characters.id, ids)))
              .map((c) => ({
                  ...c,
                  avatarUrl: c.avatarPath ? getPublicUrl(c.avatarPath) : null,
                  profileImageUrl: profileImageByCharacterId[c.id] ?? null,
              }))
              .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
        : [];

    const selectedBackground = state.selectedBackgroundId
        ? (
              await db
                  .select()
                  .from(backgrounds)
                  .where(eq(backgrounds.id, state.selectedBackgroundId))
                  .limit(1)
          ).map((bg) => ({
              ...bg,
              url: getPublicUrl(bg.storagePath),
              altUrl: bg.altStoragePath ? getPublicUrl(bg.altStoragePath) : null,
          }))[0]
        : null;

    return {
        activeAdventureId: state.activeAdventureId,
        adventure: adventureRows[0]!.adventure,
        system: adventureRows[0]!.system,
        activeCharacterIds: ids,
        activeCharacters,
        selectedBackground,
        galleryFitMode: (state.galleryFitMode ?? 'cover') as 'cover' | 'contain',
        displayMode: (state.displayMode ?? 'scene') as 'scene' | 'table',
        tableShape: (state.tableShape ?? 'round') as 'round' | 'square' | 'rectangle',
        tableSeats: state.tableSeats ?? 4,
        tableSideSeats: state.tableSideSeats ?? 0,
        seatAssignments: reconcileSeatAssignments(
            state.seatAssignments,
            ids,
            state.tableSeats ?? 4
        ),
        showCharacters: state.showCharacters ?? true,
        useAltBackground: state.useAltBackground ?? false,
    };
});
