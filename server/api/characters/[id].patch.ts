import type { CharacterUpdatedPayload } from '#shared/types/sync';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { characterGroupMembers, characters, useDb } from '../../db';

const bodySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    type: z.enum(['pc', 'npc']).optional(),
    playbook: z.string().max(255).nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
    groupIds: z.array(z.string().uuid()).optional(),
    password: z.string(),
});

export default defineEventHandler(async (event) => {
    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, message: 'id is required' });

    const body = await readBody(event);
    const { password, groupIds, ...fields } = parseOrThrow(bodySchema, body);
    requireAuth(password);

    const db = useDb();
    const rows = await db.update(characters).set(fields).where(eq(characters.id, id)).returning();
    const character = rows[0];
    if (!character) throw createError({ statusCode: 404, message: 'Character not found' });

    if (groupIds !== undefined) {
        await db.delete(characterGroupMembers).where(eq(characterGroupMembers.characterId, id));
        if (groupIds.length) {
            await db.insert(characterGroupMembers).values(
                groupIds.map((groupId) => ({ groupId, characterId: id }))
            );
        }
    }

    const payload: CharacterUpdatedPayload = {
        type: 'character-updated',
        data: { characterId: id },
    };
    broadcast(payload);

    return { character };
});
