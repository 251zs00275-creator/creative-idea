import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/lib/supabase-client', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase-client'
import { ALLOWED_THUMBNAIL_TYPES, MAX_THUMBNAIL_SIZE_BYTES, ThumbnailUploadError, uploadThumbnail } from './upload'

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes)
  return new File([content], name, { type })
}

function mockSupabase({
  user,
  uploadError,
}: {
  user: { id: string } | null
  uploadError?: { message: string }
}) {
  const client = {
    auth: { getUser: vi.fn(async () => ({ data: { user } })) },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async () => ({ error: uploadError ?? null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://storage.example.com/x.png' } })),
      })),
    },
  }
  vi.mocked(createClient).mockReturnValue(client as unknown as ReturnType<typeof createClient>)
  return client
}

describe('uploadThumbnail', () => {
  beforeEach(() => vi.mocked(createClient).mockReset())

  test('rejects a file with a disallowed MIME type', async () => {
    mockSupabase({ user: { id: 'u1' } })
    const file = makeFile('a.bmp', 'image/bmp', 100)
    await expect(uploadThumbnail(file)).rejects.toThrow(ThumbnailUploadError)
  })

  test('accepts every explicitly allowed MIME type', () => {
    expect(ALLOWED_THUMBNAIL_TYPES).toEqual(
      expect.arrayContaining(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    )
  })

  test('rejects a file larger than the max size', async () => {
    mockSupabase({ user: { id: 'u1' } })
    const file = makeFile('a.png', 'image/png', MAX_THUMBNAIL_SIZE_BYTES + 1)
    await expect(uploadThumbnail(file)).rejects.toThrow(ThumbnailUploadError)
  })

  test('rejects when there is no authenticated user', async () => {
    mockSupabase({ user: null })
    const file = makeFile('a.png', 'image/png', 100)
    await expect(uploadThumbnail(file)).rejects.toThrow(ThumbnailUploadError)
  })

  test('rejects and surfaces the message when the storage upload fails', async () => {
    mockSupabase({ user: { id: 'u1' }, uploadError: { message: 'network error' } })
    const file = makeFile('a.png', 'image/png', 100)
    await expect(uploadThumbnail(file)).rejects.toThrow('network error')
  })

  test('returns the public URL on a successful upload', async () => {
    mockSupabase({ user: { id: 'u1' } })
    const file = makeFile('a.png', 'image/png', 100)
    await expect(uploadThumbnail(file)).resolves.toBe('https://storage.example.com/x.png')
  })
})
