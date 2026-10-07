import { createBrowserClient } from '@supabase/ssr'

function cleanEnv(value?: string) {
  if (!value) return ''
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '')
  return trimmed.includes('=') ? trimmed.slice(trimmed.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '') : trimmed
}

export function createClient() {
  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseKey =
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!supabaseUrl || !/^https?:\/\//.test(supabaseUrl) || !supabaseKey) {
    throw new Error('Supabase login is not configured correctly yet.')
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
