import { beforeEach, describe, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

vi.mock('@/lib/ogp', () => ({
  fetchOgp: vi.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { fetchOgp } from '@/lib/ogp'
import { GET } from './route'

function mockAuth(user: { id: string } | null) {
  vi.mocked(createServerSupabaseClient).mockResolvedValue({
    auth: { getUser: vi.fn(async () => ({ data: { user } })) },
  } as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>)
}

describe('GET /api/ogp', () => {
  beforeEach(() => {
    vi.mocked(createServerSupabaseClient).mockReset()
    vi.mocked(fetchOgp).mockReset()
  })

  test('returns 401 when unauthenticated, without ever calling fetchOgp', async () => {
    mockAuth(null)
    const res = await GET(new NextRequest('http://localhost/api/ogp?url=https://example.com/'))
    expect(res.status).toBe(401)
    expect(fetchOgp).not.toHaveBeenCalled()
  })

  test('returns 400 when url is missing', async () => {
    mockAuth({ id: 'u1' })
    const res = await GET(new NextRequest('http://localhost/api/ogp'))
    expect(res.status).toBe(400)
  })

  test('returns 400 for a malformed url', async () => {
    mockAuth({ id: 'u1' })
    const res = await GET(new NextRequest('http://localhost/api/ogp?url=not-a-url'))
    expect(res.status).toBe(400)
  })

  test('returns the OGP data for an authenticated request with a valid url', async () => {
    mockAuth({ id: 'u1' })
    vi.mocked(fetchOgp).mockResolvedValue({ title: 'T', description: 'D', image: null })

    const res = await GET(new NextRequest('http://localhost/api/ogp?url=https://example.com/'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ title: 'T', description: 'D', image: null })
    expect(fetchOgp).toHaveBeenCalledWith('https://example.com/')
  })
})
