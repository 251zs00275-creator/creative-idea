import { describe, expect, test } from 'vitest'
import {
  buildMarkdown,
  buildSnsSummary,
  formatDateForDisplay,
  formatDateForFilename,
  getWorksheetEntries,
  sanitizeFilename,
} from './export'
import { Work } from '@/types'

function makeWork(overrides: Partial<Work> = {}): Work {
  return {
    id: 'work-1',
    user_id: 'user-1',
    title: 'テスト作品',
    category: 'illustration',
    url: null,
    thumbnail_url: null,
    memo: null,
    framework: null,
    ws_answers: null,
    created_at: '2026-03-05T12:00:00.000Z',
    ...overrides,
  }
}

describe('formatDateForFilename', () => {
  test('formats an ISO date as YYYY-MM-DD', () => {
    expect(formatDateForFilename('2026-03-05T12:00:00.000Z')).toBe('2026-03-05')
  })
})

describe('formatDateForDisplay', () => {
  test('formats an ISO date in Japanese long form', () => {
    expect(formatDateForDisplay('2026-03-05T12:00:00.000Z')).toContain('2026')
    expect(formatDateForDisplay('2026-03-05T12:00:00.000Z')).toContain('3')
  })
})

describe('sanitizeFilename', () => {
  test('replaces filesystem-unsafe characters with underscores', () => {
    expect(sanitizeFilename('a/b:c*d?e"f<g>h|i')).toBe('a_b_c_d_e_f_g_h_i')
  })

  test('collapses whitespace into underscores', () => {
    expect(sanitizeFilename('hello   world')).toBe('hello_world')
  })

  test('falls back to "untitled" only for a truly empty string', () => {
    expect(sanitizeFilename('')).toBe('untitled')
  })

  test('whitespace/unsafe-only input collapses to underscores rather than "untitled"', () => {
    // replace(unsafe chars -> '_') runs before trim(), so underscores
    // survive trim() and the "untitled" fallback is not triggered
    expect(sanitizeFilename('   ')).toBe('_')
    expect(sanitizeFilename('///')).toBe('___')
  })
})

describe('getWorksheetEntries', () => {
  test('returns an empty array when no framework is set', () => {
    expect(getWorksheetEntries(makeWork())).toEqual([])
  })

  test('filters out steps with blank answers and keeps answered ones', () => {
    const work = makeWork({
      framework: 'vts',
      ws_answers: { observation: '  ', evidence: '色使いが好き', discovery: '' },
    })

    const entries = getWorksheetEntries(work)
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ label: '根拠', answer: '色使いが好き' })
  })
})

describe('buildMarkdown', () => {
  test('includes title, category, memo and worksheet entries', () => {
    const work = makeWork({
      memo: '最初の一言メモ',
      framework: 'vts',
      ws_answers: { observation: '観察の回答' },
    })

    const md = buildMarkdown(work)
    expect(md).toContain('# テスト作品')
    expect(md).toContain('イラスト')
    expect(md).toContain('最初の一言メモ')
    expect(md).toContain('観察の回答')
  })

  test('omits URL line when work has no URL', () => {
    const md = buildMarkdown(makeWork({ url: null }))
    expect(md).not.toContain('- URL:')
  })
})

describe('buildSnsSummary', () => {
  test('prefers memo over worksheet answer as the body', () => {
    const work = makeWork({
      memo: 'メモが優先される',
      framework: 'vts',
      ws_answers: { observation: 'ワークシートの回答' },
    })

    const summary = buildSnsSummary(work)
    expect(summary).toContain('メモが優先される')
    expect(summary).not.toContain('ワークシートの回答')
  })

  test('truncates the body to stay within the SNS character limit', () => {
    const longMemo = 'あ'.repeat(500)
    const summary = buildSnsSummary(makeWork({ memo: longMemo }))
    expect(summary.length).toBeLessThanOrEqual(280)
    expect(summary).toContain('…')
  })

  test('always includes the hashtag footer', () => {
    expect(buildSnsSummary(makeWork())).toContain('#CreativeSenseArchive')
  })
})
