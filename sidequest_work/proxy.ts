import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { withTimeout } from '@/lib/supabase/safe'

function cleanEnv(value?: string) {
  if (!value) return ''
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '')
  return trimmed.includes('=') ? trimmed.slice(trimmed.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '') : trimmed
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabaseUrl = cleanEnv(process.env.SUPABASE_URL) || cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseKey =
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!isValidHttpUrl(supabaseUrl) || !supabaseKey) {
    return response
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    })

    // Never let Supabase make navigation hang. Public routes are not matched at all,
    // and protected-route session refresh gets a short timeout.
    await withTimeout(supabase.auth.getUser(), 2500, 'Supabase session refresh timed out')
  } catch (error) {
    console.warn('[SideQuest] session refresh skipped:', error)
  }

  return response
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/saved/:path*',
    '/account/:path*',
    '/quest/:path*',
    '/auth/callback/:path*',
    '/auth/confirm/:path*',
  ],
}
