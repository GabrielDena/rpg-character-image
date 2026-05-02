import { supabaseAdmin } from '../../utils/supabaseAdmin'

export default defineEventHandler(async (event) => {
  const { path = '' } = getQuery(event) as { path?: string }

  const { data, error } = await supabaseAdmin().storage
    .from('adventures')
    .list(path, { limit: 500, sortBy: { column: 'name', order: 'asc' } })

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { items: data ?? [] }
})
