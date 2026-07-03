import { describe, expect, test } from 'vitest'
import { workCreateSchema, workUpdateSchema } from './work'

describe('workCreateSchema', () => {
  test('accepts a minimal valid payload', () => {
    const result = workCreateSchema.safeParse({ title: 'テスト', category: 'movie' })
    expect(result.success).toBe(true)
  })

  test('accepts a fully populated valid payload', () => {
    const result = workCreateSchema.safeParse({
      title: 'テスト',
      category: 'illustration',
      url: 'https://example.com/art',
      thumbnail_url: 'https://example.com/thumb.png',
      memo: 'メモ',
      framework: 'vts',
      ws_answers: { observation: '観察の回答' },
    })
    expect(result.success).toBe(true)
  })

  test('rejects an empty title', () => {
    expect(workCreateSchema.safeParse({ title: '', category: 'movie' }).success).toBe(false)
    expect(workCreateSchema.safeParse({ title: '   ', category: 'movie' }).success).toBe(false)
  })

  test('rejects a title longer than the max length', () => {
    const result = workCreateSchema.safeParse({ title: 'あ'.repeat(201), category: 'movie' })
    expect(result.success).toBe(false)
  })

  test('rejects a category outside the fixed enum', () => {
    const result = workCreateSchema.safeParse({ title: 'テスト', category: 'not-a-real-category' })
    expect(result.success).toBe(false)
  })

  test('rejects a framework outside the fixed enum', () => {
    const result = workCreateSchema.safeParse({
      title: 'テスト',
      category: 'movie',
      framework: 'not-a-real-framework',
    })
    expect(result.success).toBe(false)
  })

  test('treats an empty-string url as absent rather than invalid', () => {
    const result = workCreateSchema.safeParse({ title: 'テスト', category: 'movie', url: '' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.url).toBeUndefined()
  })

  test('rejects a non-http(s) url scheme', () => {
    const result = workCreateSchema.safeParse({
      title: 'テスト',
      category: 'movie',
      url: 'javascript:alert(1)',
    })
    expect(result.success).toBe(false)
  })

  test('rejects a malformed url string', () => {
    const result = workCreateSchema.safeParse({ title: 'テスト', category: 'movie', url: 'not a url' })
    expect(result.success).toBe(false)
  })

  test('rejects ws_answers with too many entries', () => {
    const manyAnswers = Object.fromEntries(
      Array.from({ length: 51 }, (_, i) => [`q${i}`, 'a'])
    )
    const result = workCreateSchema.safeParse({
      title: 'テスト',
      category: 'movie',
      ws_answers: manyAnswers,
    })
    expect(result.success).toBe(false)
  })

  test('rejects a memo longer than the max length', () => {
    const result = workCreateSchema.safeParse({
      title: 'テスト',
      category: 'movie',
      memo: 'あ'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })

  test('rejects unknown fields being silently accepted with an unexpected type', () => {
    // category as a number should never pass through as a string enum value
    const result = workCreateSchema.safeParse({ title: 'テスト', category: 123 })
    expect(result.success).toBe(false)
  })
})

describe('workUpdateSchema', () => {
  test('accepts a partial payload with only one field', () => {
    const result = workUpdateSchema.safeParse({ memo: '更新後メモ' })
    expect(result.success).toBe(true)
  })

  test('accepts an empty object (no-op update is validated elsewhere)', () => {
    expect(workUpdateSchema.safeParse({}).success).toBe(true)
  })

  test('still enforces per-field constraints when present', () => {
    expect(workUpdateSchema.safeParse({ category: 'invalid' }).success).toBe(false)
    expect(workUpdateSchema.safeParse({ title: '' }).success).toBe(false)
  })
})
