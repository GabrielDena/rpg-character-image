import { asc, eq, inArray } from 'drizzle-orm';
import { characterGroupMembers, characterGroups, useDb } from '../db';

export default defineEventHandler(async (event) => {
    const { adventureId } = getQuery(event);
    if (!adventureId || typeof adventureId !== 'string') {
        throw createError({ statusCode: 400, message: 'adventureId is required' });
    }

    const db = useDb();
    const groups = await db
        .select()
        .from(characterGroups)
        .where(eq(characterGroups.adventureId, adventureId))
        .orderBy(asc(characterGroups.createdAt));

    const members = groups.length
        ? await db
              .select()
              .from(characterGroupMembers)
              .where(inArray(characterGroupMembers.groupId, groups.map((g) => g.id)))
        : [];

    const memberMap = new Map<string, string[]>();
    for (const m of members) {
        if (!memberMap.has(m.groupId)) memberMap.set(m.groupId, []);
        memberMap.get(m.groupId)!.push(m.characterId);
    }

    return {
        groups: groups.map((g) => ({
            ...g,
            memberIds: memberMap.get(g.id) ?? [],
        })),
    };
});
