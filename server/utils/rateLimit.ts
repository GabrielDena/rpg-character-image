import type { H3Event } from 'h3'

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 10

interface Attempt {
  count: number
  resetAt: number
}

const attempts = new Map<string, Attempt>()

export function checkRateLimit(event: H3Event): void {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const now = Date.now()
  const record = attempts.get(ip)

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return
  }

  if (record.count >= MAX_ATTEMPTS) {
    throw createError({ statusCode: 429, message: 'Too many attempts, try again later' })
  }

  record.count++
}

export function clearRateLimit(event: H3Event): void {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  attempts.delete(ip)
}
