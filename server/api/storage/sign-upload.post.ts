import { checkPassword } from '../../utils/auth'
import { supabaseAdmin } from '../../utils/supabaseAdmin'

export default defineEventHandler(async (event) => {
  const { password, path } = await readBody<{ password: string; path: string }>(event)

  if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Incorrect password' })
  if (!path) throw createError({ statusCode: 400, message: 'Path is required' })

  const { data, error } = await supabaseAdmin().storage
    .from('adventures')
    .createSignedUploadUrl(path)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data // { signedUrl, token, path }
})
