/**
 * サムネイルURLが自プロジェクトのSupabase Storageから配信されているかを判定する。
 * OGP由来の任意外部ドメイン画像はnext/imageの最適化対象にしない
 * （remotePatternsに未知ドメインを無制限追加するとSSRF類似のリスクがあるため）。
 */
export function isSupabaseStorageUrl(
  imageUrl: string,
  supabaseUrl: string | undefined
): boolean {
  if (!supabaseUrl) return false

  try {
    const image = new URL(imageUrl)
    const supabase = new URL(supabaseUrl)
    return image.hostname === supabase.hostname
  } catch {
    return false
  }
}
