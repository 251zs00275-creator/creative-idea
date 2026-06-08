import { NextRequest, NextResponse } from 'next/server'
import { fetchOgp } from '@/lib/ogp'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const data = await fetchOgp(url)
  return NextResponse.json(data)
}
