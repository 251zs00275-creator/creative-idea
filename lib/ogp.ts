import * as cheerio from 'cheerio'
import { OgpData } from '@/types'

const TIMEOUT_MS = 8000

export async function fetchOgp(url: string): Promise<OgpData> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; CreativeSenseArchiveBot/1.0)',
      },
    })

    if (!res.ok) {
      return { title: null, description: null, image: null }
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    const getMeta = (property: string): string | null =>
      $(`meta[property="${property}"]`).attr('content') ??
      $(`meta[name="${property}"]`).attr('content') ??
      null

    const title =
      getMeta('og:title') ??
      $('title').first().text().trim() ??
      null

    const description =
      getMeta('og:description') ??
      getMeta('description') ??
      null

    const rawImage = getMeta('og:image')
    const image = rawImage ? resolveUrl(rawImage, url) : null

    return { title, description, image }
  } catch {
    return { title: null, description: null, image: null }
  } finally {
    clearTimeout(timer)
  }
}

function resolveUrl(src: string, base: string): string {
  try {
    return new URL(src, base).toString()
  } catch {
    return src
  }
}
