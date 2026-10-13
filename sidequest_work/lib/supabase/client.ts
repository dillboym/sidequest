import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { SESSION_PREFERENCE, sessionCookieOptions } from './session-policy'

export function setSessionPersistence(persistent: boolean) {
  document.cookie = serializeCookieHeader(SESSION_PREFERENCE, persistent ? 'yes' : 'no', {
    path: '/', sameSite: 'lax', secure: window.location.protocol === 'https:', maxAge: 31536000,
  })
}

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

  return createBrowserClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => typeof document === 'undefined' ? [] : parseCookieHeader(document.cookie),
      setAll(cookies) {
        const persistent = !parseCookieHeader(document.cookie).some(cookie => cookie.name === SESSION_PREFERENCE && cookie.value === 'no')
        cookies.forEach(({ name, value, options }) => {
          document.cookie = serializeCookieHeader(name, value, sessionCookieOptions(options, persistent))
        })
      },
    },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000) }) },
  })
}
