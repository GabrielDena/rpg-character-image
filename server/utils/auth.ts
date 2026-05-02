export function checkPassword(password: unknown): boolean {
  return typeof password === 'string' && !!process.env.APP_PASSWORD && password === process.env.APP_PASSWORD
}
