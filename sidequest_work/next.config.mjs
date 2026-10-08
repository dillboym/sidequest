import { resolveSupabaseUrl, resolveSupabaseKey } from './lib/supabase/config.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: resolveSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: resolveSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
