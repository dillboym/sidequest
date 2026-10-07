import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type')
  const next = url.searchParams.get('next')
  const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : '/generate'
  if (!tokenHash || !type) return NextResponse.redirect(new URL('/auth?error=missing_confirmation', url.origin))
  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type: type as 'email', token_hash: tokenHash })
  if (error) return NextResponse.redirect(new URL('/auth?error=invalid_confirmation', url.origin))
  return NextResponse.redirect(new URL(safeNext, url.origin))
}
