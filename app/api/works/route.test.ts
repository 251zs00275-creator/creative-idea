import { beforeEach, describe, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { GET, POST } from './route'

type QueryResult = { data: unknown; error: { message: string } | null; count?: number }

function createQueryBuilderMock(result: QueryResult) {
  const builder: Record<string, unknown> = {}
  const chain = () => builder

  builder.select = vi.fn(chain)
  builder.eq = vi.fn(chain)
  builder.order = vi.fn(chain)
  builder.or = vi.fn(chain)
  builder.insert = vi.fn(chain)
  builder.range = vi.fn(chain)
  builder.single = vi.fn(() => Promise.resolve(result))
  // GET /api/works awaits the builder directly (no .single())
  builder.then = (
    resolve: (value: QueryResult) => void,
    reject: (reason: unknown) => void
  ) => Promise.resolve(result).then(resolve, reject)

  return builder
}

function mockSupabase(user: { id: string } | null, result: QueryResult) {
  const client = {
    auth: { getUser: vi.fn(async () => ({ data: { user } })) },
    from: vi.fn(() => createQueryBuilderMock(result)),
  }
  vi.mocked(createServerSupabaseClient).mockResolvedValue(
    client as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>
  )
  return client
}

describe('GET /api/works', () => {
  beforeEach(() => {
    vi.mocked(createServerSupabaseClient).mockReset()
  })

  test('returns 401 when unauthenticated', async () => {
    mockSupabase(null, { data: null, error: null })
    const res = await GET(new NextRequest('http://localhost/api/works'))
    expect(res.status).toBe(401)
  })

  test('returns a paginated envelope for an authenticated user', async () => {
    mockSupabase(
      { id: 'user-1' },
      { data: [{ id: 'w1', title: 'テスト' }], error: null, count: 1 }
    )
    const res = await GET(new NextRequest('http://localhost/api/works'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      data: [{ id: 'w1', title: 'テスト' }],
      page: 1,
      pageSize: 24,
      totalCount: 1,
      hasMore: false,
    })
  })

  test('passes page/pageSize query params through to the range() call', async () => {
    const client = mockSupabase({ id: 'user-1' }, { data: [], error: null, count: 0 })
    await GET(new NextRequest('http://localhost/api/works?page=2&pageSize=10'))
    const builder = client.from.mock.results[0].value as { range: ReturnType<typeof vi.fn> }
    expect(builder.range).toHaveBeenCalledWith(10, 19)
  })

  test('returns a generic 500 message without leaking the raw DB error', async () => {
    mockSupabase(
      { id: 'user-1' },
      { data: null, error: { message: 'relation "works" does not exist' } }
    )
    const res = await GET(new NextRequest('http://localhost/api/works'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).not.toContain('relation')
  })
})

describe('POST /api/works', () => {
  beforeEach(() => {
    vi.mocked(createServerSupabaseClient).mockReset()
  })

  function postRequest(body: unknown) {
    return new NextRequest('http://localhost/api/works', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  test('returns 401 when unauthenticated', async () => {
    mockSupabase(null, { data: null, error: null })
    const res = await POST(postRequest({ title: 'テスト', category: 'movie' }))
    expect(res.status).toBe(401)
  })

  test('returns 400 when title is missing', async () => {
    mockSupabase({ id: 'user-1' }, { data: null, error: null })
    const res = await POST(postRequest({ category: 'movie' }))
    expect(res.status).toBe(400)
  })

  test('returns 400 when category is not one of the fixed enum values', async () => {
    mockSupabase({ id: 'user-1' }, { data: null, error: null })
    const res = await POST(postRequest({ title: 'テスト', category: 'not-real' }))
    expect(res.status).toBe(400)
  })

  test('returns 400 when url is not a valid http(s) URL', async () => {
    mockSupabase({ id: 'user-1' }, { data: null, error: null })
    const res = await POST(postRequest({ title: 'テスト', category: 'movie', url: 'javascript:alert(1)' }))
    expect(res.status).toBe(400)
  })

  test('creates a work and returns 201 for a valid payload', async () => {
    const created = { id: 'w1', title: 'テスト', category: 'movie' }
    mockSupabase({ id: 'user-1' }, { data: created, error: null })

    const res = await POST(postRequest({ title: 'テスト', category: 'movie' }))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(created)
  })
})
