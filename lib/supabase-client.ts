import { createBrowserClient } from '@supabase/ssr'

/** Browser (Client Component) — env vars read lazily at call time */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (url && key) {
    return createBrowserClient(url, key)
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません'
    )
  }

  // 開発・テスト時のみ: URLバリデーションエラーでビルド/テストが
  // 落ちるのを防ぐためのフォールバック（本番では上でthrowする）
  return createBrowserClient(
    url || 'https://placeholder.supabase.co',
    key || 'placeholder-anon-key'
  )
}
