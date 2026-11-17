import { z } from 'zod';
import { characterGroupMembers, characters, useDb } from '../db';

const bodySchema = z.object({
    adventureId: z.string().uuid(),
    name: z.string().min(1, 'Name is required').max(255),
    type: z.enum(['pc', 'npc']).default('npc'),
    playbook: z.string().max(255).optional(),
    description: z.string().max(2000).optional(),
    groupIds: z.array(z.string().uuid()).optional(),
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { adventureId, name, type, playbook, description, groupIds, password } = parseOrThrow(bodySchema, body);
    requireAuth(password);

    const db = useDb();
    const rows = await db
        .insert(characters)
        .values({ adventureId, name, type, playbook, description })
        .returning();
    const character = rows[0];
    if (!character) throw createError({ statusCode: 500, message: 'Failed to create character' });

    if (groupIds?.length) {
        await db.insert(characterGroupMembers).values(
            groupIds.map((groupId) => ({ groupId, characterId: character.id }))
        );
    }

    return { character };
});
