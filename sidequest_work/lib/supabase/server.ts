import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { resolveSupabaseUrl, resolveSupabaseKey } from './config.mjs'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL)
  const supabaseKey = resolveSupabaseKey(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  if (!supabaseUrl || !/^https?:\/\//.test(supabaseUrl) || !supabaseKey) {
    throw new Error('Supabase is not configured correctly on this deployment.')
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Components cannot always write cookies; proxy refreshes sessions.
        }
      },
    },
  })
}
