import { checkPassword } from '../../utils/auth'
import { supabaseAdmin } from '../../utils/supabaseAdmin'

export default defineEventHandler(async (event) => {
  const { password, path = '' } = await readBody<{ password: string; path?: string }>(event)

  if (!checkPassword(password)) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const { data, error } = await supabaseAdmin().storage
    .from('adventures')
    .list(path, { limit: 500, sortBy: { column: 'name', order: 'asc' } })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { items: data ?? [] }
})
