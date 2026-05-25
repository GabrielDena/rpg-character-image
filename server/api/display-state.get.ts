import { and, eq, inArray } from 'drizzle-orm';
import { adventures, backgrounds, characterImages, characters, displayState, systems, useDb } from '../db';
import { getPublicUrl, getPublicUrl } from '../utils/storage';

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
        };
    }

    const ids = state.activeCharacterIds ?? [];

    const profileImages = ids.length
        ? await db
              .select()
              .from(characterImages)
              .where(and(inArray(characterImages.characterId, ids), eq(characterImages.isProfile, true)))
        : [];

    const profileImageByCharacterId = Object.fromEntries(
        profileImages.map((img) => [img.characterId, getPublicUrl(img.storagePath)])
    );

    const activeCharacters = ids.length
        ? (await db.select().from(characters).where(inArray(characters.id, ids))).map((c) => ({
              ...c,
              avatarUrl: c.avatarPath ? getPublicUrl(c.avatarPath) : null,
              profileImageUrl: profileImageByCharacterId[c.id] ?? null,
          }))
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
    };
});

