import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { withTimeout } from '@/lib/supabase/safe'

import { resolveSupabaseUrl, resolveSupabaseKey } from '@/lib/supabase/config.mjs'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabaseUrl = resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL)
  const supabaseKey = resolveSupabaseKey(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  if (!supabaseUrl || !supabaseKey) {
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
