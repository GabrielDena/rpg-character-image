import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _admin: SupabaseClient | null = null

export function supabaseAdmin() {
  if (!_admin) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SECRET_KEY
    if (!url || !key) throw new Error('SUPABASE_URL or SUPABASE_SECRET_KEY not set')
    _admin = createClient(url, key, { auth: { persistSession: false } })
  }
  return _admin
}
