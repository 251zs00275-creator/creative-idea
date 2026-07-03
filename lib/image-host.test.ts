import { describe, expect, test } from 'vitest'
import { isSupabaseStorageUrl } from './image-host'

const SUPABASE_URL = 'https://abcdefgh.supabase.co'

describe('isSupabaseStorageUrl', () => {
  test('returns true for a URL hosted on the configured Supabase project', () => {
    expect(
      isSupabaseStorageUrl(
        'https://abcdefgh.supabase.co/storage/v1/object/public/thumbnails/u1/x.png',
        SUPABASE_URL
      )
    ).toBe(true)
  })

  test('returns false for an external (e.g. OGP-derived) image URL', () => {
    expect(isSupabaseStorageUrl('https://example.com/og-image.png', SUPABASE_URL)).toBe(false)
  })

  test('returns false for a malformed URL', () => {
    expect(isSupabaseStorageUrl('not a url', SUPABASE_URL)).toBe(false)
  })

  test('returns false when supabaseUrl itself is not configured', () => {
    expect(isSupabaseStorageUrl('https://abcdefgh.supabase.co/x.png', undefined)).toBe(false)
  })
})
