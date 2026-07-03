import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const { lookupMock } = vi.hoisted(() => ({ lookupMock: vi.fn() }))

vi.mock('node:dns/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:dns/promises')>()
  return { ...actual, lookup: lookupMock }
})

import { fetchOgp } from './ogp'

function htmlResponse(html: string, init: Partial<{ status: number; url: string }> = {}) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(html))
      controller.close()
    },
  })

  return new Response(body, { status: init.status ?? 200 }) as Response & { url: string }
}

describe('fetchOgp', () => {
  beforeEach(() => {
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('extracts og:title, og:description and resolves og:image to an absolute URL', async () => {
    const html = `
      <html><head>
        <meta property="og:title" content="タイトル" />
        <meta property="og:description" content="説明文" />
        <meta property="og:image" content="/images/thumb.png" />
      </head></html>
    `
    const fetchMock = vi.fn().mockResolvedValue(htmlResponse(html))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchOgp('https://example.com/article')

    expect(result).toEqual({
      title: 'タイトル',
      description: '説明文',
      image: 'https://example.com/images/thumb.png',
    })
  })

  test('falls back to <title> when og:title is missing, treating blank text as null', async () => {
    const html = '<html><head><title>  ページタイトル  </title></head></html>'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlResponse(html)))

    const result = await fetchOgp('https://example.com/')
    expect(result.title).toBe('ページタイトル')
  })

  test('returns all-null title when there is no og:title and <title> is blank', async () => {
    const html = '<html><head><title>   </title></head></html>'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlResponse(html)))

    const result = await fetchOgp('https://example.com/')
    expect(result.title).toBeNull()
  })

  test('returns nulls when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlResponse('', { status: 500 })))

    const result = await fetchOgp('https://example.com/')
    expect(result).toEqual({ title: null, description: null, image: null })
  })

  test('returns nulls instead of throwing when the target is unsafe (SSRF guard)', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchOgp('http://169.254.169.254/latest/meta-data/')
    expect(result).toEqual({ title: null, description: null, image: null })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('follows a same-safety redirect and re-validates the new location', async () => {
    const finalHtml = '<html><head><meta property="og:title" content="リダイレクト先" /></head></html>'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: 'https://example.com/final' } })
      )
      .mockResolvedValueOnce(htmlResponse(finalHtml))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchOgp('https://example.com/start')
    expect(result.title).toBe('リダイレクト先')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('gives up after exceeding the maximum redirect hops', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 302, headers: { location: 'https://example.com/next' } })
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchOgp('https://example.com/loop')
    expect(result).toEqual({ title: null, description: null, image: null })
  })
})
