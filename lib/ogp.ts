import * as cheerio from 'cheerio'
import { OgpData } from '@/types'
import { assertSafeUrl } from '@/lib/url-safety'

const TIMEOUT_MS = 8000
const MAX_REDIRECTS = 3
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024 // 2MB — OGPメタデータの取得に十分な上限

/** 空文字・空白のみの文字列をnullとして扱う */
function nullIfBlank(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export async function fetchOgp(url: string): Promise<OgpData> {
  try {
    const res = await fetchFollowingSafeRedirects(url)

    if (!res || !res.ok) {
      return { title: null, description: null, image: null }
    }

    const html = await readBodyWithLimit(res)
    const $ = cheerio.load(html)

    const getMeta = (property: string): string | null =>
      nullIfBlank($(`meta[property="${property}"]`).attr('content')) ??
      nullIfBlank($(`meta[name="${property}"]`).attr('content'))

    const title =
      getMeta('og:title') ?? nullIfBlank($('title').first().text())

    const description =
      getMeta('og:description') ?? getMeta('description')

    const rawImage = getMeta('og:image')
    const image = rawImage ? resolveUrl(rawImage, res.url || url) : null

    return { title, description, image }
  } catch {
    return { title: null, description: null, image: null }
  }
}

/**
 * SSRF対策のためリダイレクトを自動追従せず、遷移先ごとに
 * assertSafeUrlで検証してから手動でたどる。
 */
async function fetchFollowingSafeRedirects(
  initialUrl: string
): Promise<Response | null> {
  let currentUrl = initialUrl

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeUrl(currentUrl)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    let res: Response
    try {
      res = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; CreativeSenseArchiveBot/1.0)',
        },
      })
    } finally {
      clearTimeout(timer)
    }

    const isRedirect = res.status >= 300 && res.status < 400
    if (!isRedirect) {
      return res
    }

    const location = res.headers.get('location')
    if (!location) return null

    currentUrl = new URL(location, currentUrl).toString()
  }

  return null
}

/** レスポンスボディをサイズ上限付きで文字列として読み取る */
async function readBodyWithLimit(res: Response): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return ''

  const chunks: Uint8Array[] = []
  let totalBytes = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break

    totalBytes += value.byteLength
    if (totalBytes > MAX_RESPONSE_BYTES) {
      await reader.cancel()
      break
    }
    chunks.push(value)
  }

  return Buffer.concat(chunks).toString('utf-8')
}

function resolveUrl(src: string, base: string): string {
  try {
    return new URL(src, base).toString()
  } catch {
    return src
  }
}
