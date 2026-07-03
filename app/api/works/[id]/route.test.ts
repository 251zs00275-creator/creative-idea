import { beforeEach, describe, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { DELETE, GET, PATCH } from './route'

type QueryResult = { data: unknown; error: { message: string } | null }

function createQueryBuilderMock(result: QueryResult) {
  const builder: Record<string, unknown> = {}
  const chain = () => builder

  builder.select = vi.fn(chain)
  builder.eq = vi.fn(chain)
  builder.update = vi.fn(chain)
  builder.delete = vi.fn(chain)
  builder.single = vi.fn(() => Promise.resolve(result))
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

const params = Promise.resolve({ id: 'work-1' })

describe('GET /api/works/[id]', () => {
  beforeEach(() => vi.mocked(createServerSupabaseClient).mockReset())

  test('returns 401 when unauthenticated', async () => {
    mockSupabase(null, { data: null, error: null })
    const res = await GET(new NextRequest('http://localhost/api/works/work-1'), { params })
    expect(res.status).toBe(401)
  })

  test('returns 404 when the work does not belong to the user', async () => {
    mockSupabase({ id: 'user-1' }, { data: null, error: { message: 'not found' } })
    const res = await GET(new NextRequest('http://localhost/api/works/work-1'), { params })
    expect(res.status).toBe(404)
  })

  test('returns the work for its owner', async () => {
    mockSupabase({ id: 'user-1' }, { data: { id: 'work-1', title: 'テスト' }, error: null })
    const res = await GET(new NextRequest('http://localhost/api/works/work-1'), { params })
    expect(res.status).toBe(200)
  })
})

describe('PATCH /api/works/[id]', () => {
  beforeEach(() => vi.mocked(createServerSupabaseClient).mockReset())

  function patchRequest(body: unknown) {
    return new NextRequest('http://localhost/api/works/work-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  test('returns 401 when unauthenticated', async () => {
    mockSupabase(null, { data: null, error: null })
    const res = await PATCH(patchRequest({ memo: '更新' }), { params })
    expect(res.status).toBe(401)
  })

  test('returns 400 for an empty update payload', async () => {
    mockSupabase({ id: 'user-1' }, { data: null, error: null })
    const res = await PATCH(patchRequest({}), { params })
    expect(res.status).toBe(400)
  })

  test('returns 400 when every field normalizes to undefined (e.g. blank url)', async () => {
    // url: '' is preprocessed to undefined by workUpdateSchema, so this must
    // still be rejected as "nothing to update" rather than silently no-op-succeeding
    mockSupabase({ id: 'user-1' }, { data: null, error: null })
    const res = await PATCH(patchRequest({ url: '' }), { params })
    expect(res.status).toBe(400)
  })

  test('returns 400 when an updated field violates validation (invalid category)', async () => {
    mockSupabase({ id: 'user-1' }, { data: null, error: null })
    const res = await PATCH(patchRequest({ category: 'not-real' }), { params })
    expect(res.status).toBe(400)
  })

  test('updates and returns the work for a valid partial payload', async () => {
    const updated = { id: 'work-1', memo: '更新後' }
    mockSupabase({ id: 'user-1' }, { data: updated, error: null })
    const res = await PATCH(patchRequest({ memo: '更新後' }), { params })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(updated)
  })
})

describe('DELETE /api/works/[id]', () => {
  beforeEach(() => vi.mocked(createServerSupabaseClient).mockReset())

  test('returns 401 when unauthenticated', async () => {
    mockSupabase(null, { data: null, error: null })
    const res = await DELETE(new NextRequest('http://localhost/api/works/work-1'), { params })
    expect(res.status).toBe(401)
  })

  test('returns 204 on successful deletion', async () => {
    mockSupabase({ id: 'user-1' }, { data: null, error: null })
    const res = await DELETE(new NextRequest('http://localhost/api/works/work-1'), { params })
    expect(res.status).toBe(204)
  })
})
