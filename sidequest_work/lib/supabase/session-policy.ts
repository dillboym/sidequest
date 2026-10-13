import type { CookieOptions } from '@supabase/ssr'

export const SESSION_PREFERENCE = 'sq-keep-signed-in'

export function sessionCookieOptions(options: CookieOptions, persistent: boolean): CookieOptions {
  const result = { ...options, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' }
  // Keep deletion cookies intact; strip expiry only for browser-session cookies.
  if (!persistent && result.maxAge !== 0) {
    delete result.maxAge
    delete result.expires
  }
  return result
}
