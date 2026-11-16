import { asc, eq, inArray } from 'drizzle-orm';
import { characterGroupMembers, characters, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const { adventureId } = getQuery(event);
    if (!adventureId || typeof adventureId !== 'string') {
        throw createError({ statusCode: 400, message: 'adventureId is required' });
    }

    const db = useDb();
    const rows = await db
        .select()
        .from(characters)
        .where(eq(characters.adventureId, adventureId))
        .orderBy(asc(characters.createdAt));

    const members = rows.length
        ? await db
              .select()
              .from(characterGroupMembers)
              .where(inArray(characterGroupMembers.characterId, rows.map((c) => c.id)))
        : [];

    const groupMap = new Map<string, string[]>();
    for (const m of members) {
        if (!groupMap.has(m.characterId)) groupMap.set(m.characterId, []);
        groupMap.get(m.characterId)!.push(m.groupId);
    }

    return {
        characters: rows.map((c) => ({
            ...c,
            avatarUrl: c.avatarPath ? getPublicUrl(c.avatarPath) : null,
            groupIds: groupMap.get(c.id) ?? [],
        })),
    };
});
