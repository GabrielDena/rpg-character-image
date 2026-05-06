import { checkPassword } from '../../utils/auth'
import { supabaseAdmin } from '../../utils/supabaseAdmin'
import { STORAGE_BUCKET } from '../../utils/constants'

export default defineEventHandler(async (event) => {
  const { password, path } = await readBody<{ password: string; path: string }>(event)

  if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Incorrect password' })
  if (!path) throw createError({ statusCode: 400, message: 'Path is required' })

  const { error } = await supabaseAdmin().storage
    .from(STORAGE_BUCKET)
    .upload(path, new Blob(['']))

  if (error && !error.message.includes('already exists')) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { ok: true }
})
