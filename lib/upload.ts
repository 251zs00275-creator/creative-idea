import { createClient } from '@/lib/supabase-client'

export const THUMBNAIL_BUCKET = 'thumbnails'
export const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_THUMBNAIL_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export class ThumbnailUploadError extends Error {}

/**
 * Uploads an image file to the `thumbnails` storage bucket under the
 * current user's folder and returns its public URL.
 */
export async function uploadThumbnail(file: File): Promise<string> {
  if (!ALLOWED_THUMBNAIL_TYPES.includes(file.type)) {
    throw new ThumbnailUploadError('対応していない画像形式です（JPEG/PNG/WebP/GIF）')
  }

  if (file.size > MAX_THUMBNAIL_SIZE_BYTES) {
    throw new ThumbnailUploadError('画像サイズは5MB以下にしてください')
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new ThumbnailUploadError('ログインが必要です')
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(THUMBNAIL_BUCKET)
    .upload(path, file, { contentType: file.type })

  if (error) {
    throw new ThumbnailUploadError(error.message)
  }

  const { data } = supabase.storage.from(THUMBNAIL_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
