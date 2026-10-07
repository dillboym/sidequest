import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function cleanEnv(value?: string) {
  if (!value) return ''
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '')
  return trimmed.includes('=') ? trimmed.slice(trimmed.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '') : trimmed
}

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = cleanEnv(process.env.SUPABASE_URL) || cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseKey =
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

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
