import type { ZodSchema } from 'zod';

export function parseOrThrow<T>(schema: ZodSchema<T>, body: unknown): T {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? 'Invalid input',
        });
    }
    return parsed.data;
}
