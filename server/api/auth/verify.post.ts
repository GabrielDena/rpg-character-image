import { checkPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const { password } = await readBody<{ password: string }>(event)
  if (!checkPassword(password)) {
    throw createError({ statusCode: 401, message: 'Incorrect password' })
  }
  return { ok: true }
})
