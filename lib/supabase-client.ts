import { createBrowserClient } from '@supabase/ssr'

/** Browser (Client Component) — env vars read lazily at call time */
export function createClient() {
  // Fallback prevents URL validation errors during build/test
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  return createBrowserClient(url, key)
}
