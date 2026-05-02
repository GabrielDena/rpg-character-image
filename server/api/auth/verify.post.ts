import { checkPassword } from '../../utils/auth'
import { checkRateLimit, clearRateLimit } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  checkRateLimit(event)

  const { password } = await readBody<{ password: string }>(event)
  if (!checkPassword(password)) {
    throw createError({ statusCode: 401, message: 'Incorrect password' })
  }

  clearRateLimit(event)
  return { ok: true }
})
