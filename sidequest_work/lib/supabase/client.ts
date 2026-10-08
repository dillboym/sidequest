import { createBrowserClient } from '@supabase/ssr'

import { resolveSupabaseUrl, resolveSupabaseKey } from './config.mjs'

export function createClient() {
  const supabaseUrl = resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseKey = resolveSupabaseKey(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  if (!supabaseUrl || !/^https?:\/\//.test(supabaseUrl) || !supabaseKey) {
    throw new Error('Supabase login is not configured correctly yet.')
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
