import { beforeEach, describe, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { GET, PATCH } from './route'

type QueryResult = { data: unknown; error: { message: string } | null }

function createQueryBuilderMock(result: QueryResult) {
  const builder: Record<string, unknown> = {}
  const chain = () => builder
  builder.select = vi.fn(chain)
  builder.eq = vi.fn(chain)
  builder.update = vi.fn(chain)
  builder.single = vi.fn(() => Promise.resolve(result))
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
}

describe('GET /api/settings/profile', () => {
  beforeEach(() => vi.mocked(createServerSupabaseClient).mockReset())

  test('returns 401 when unauthenticated', async () => {
    mockSupabase(null, { data: null, error: null })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  test('returns the profile for an authenticated user', async () => {
    mockSupabase({ id: 'u1' }, { data: { email: 'a@example.com', display_name: 'A' }, error: null })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ email: 'a@example.com', display_name: 'A' })
  })
})

describe('PATCH /api/settings/profile', () => {
  beforeEach(() => vi.mocked(createServerSupabaseClient).mockReset())

  function patchRequest(body: unknown) {
    return new NextRequest('http://localhost/api/settings/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  test('returns 401 when unauthenticated', async () => {
    mockSupabase(null, { data: null, error: null })
    const res = await PATCH(patchRequest({ display_name: 'A' }))
    expect(res.status).toBe(401)
  })

  test('returns 400 when display_name is missing', async () => {
    mockSupabase({ id: 'u1' }, { data: null, error: null })
    const res = await PATCH(patchRequest({}))
    expect(res.status).toBe(400)
  })

  test('returns 400 for a blank display_name', async () => {
    mockSupabase({ id: 'u1' }, { data: null, error: null })
    const res = await PATCH(patchRequest({ display_name: '   ' }))
    expect(res.status).toBe(400)
  })

  test('returns 400 when display_name exceeds the max length', async () => {
    mockSupabase({ id: 'u1' }, { data: null, error: null })
    const res = await PATCH(patchRequest({ display_name: 'あ'.repeat(51) }))
    expect(res.status).toBe(400)
  })

  test('updates and returns the profile for a valid display_name', async () => {
    mockSupabase({ id: 'u1' }, { data: { email: 'a@example.com', display_name: '新しい名前' }, error: null })
    const res = await PATCH(patchRequest({ display_name: '新しい名前' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ email: 'a@example.com', display_name: '新しい名前' })
  })
})
