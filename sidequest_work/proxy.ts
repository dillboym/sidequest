import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  // Prefer the server-only URL at runtime. This prevents a bad public env value
  // from taking the whole website down before the user even reaches auth.
  const supabaseUrl = cleanEnv(process.env.SUPABASE_URL) || cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseKey =
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!isValidHttpUrl(supabaseUrl) || !supabaseKey) {
    console.error('[SideQuest] Supabase environment is invalid; skipping session refresh for this request.')
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

    await supabase.auth.getUser()
  } catch (error) {
    // Auth refresh must never turn the public homepage into a 500 error.
    console.error('[SideQuest] Supabase session refresh failed:', error)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
