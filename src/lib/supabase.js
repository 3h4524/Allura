import { createClient } from '@supabase/supabase-js'

const url = String(import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const key = String(import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '').trim()

export const supabase = url && key ? createClient(url, key) : null

export async function currentUser() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user || null
}
