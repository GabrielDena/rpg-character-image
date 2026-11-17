export function checkPassword(password: unknown): boolean {
    return (
        typeof password === 'string' &&
        !!process.env.APP_PASSWORD &&
        password === process.env.APP_PASSWORD
    );
}

export function requireAuth(password: unknown): void {
    if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' });
}
