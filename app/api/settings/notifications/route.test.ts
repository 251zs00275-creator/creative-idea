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

describe('GET /api/settings/notifications', () => {
  beforeEach(() => vi.mocked(createServerSupabaseClient).mockReset())

  test('returns 401 when unauthenticated', async () => {
    mockSupabase(null, { data: null, error: null })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  test('returns the settings for an authenticated user', async () => {
    mockSupabase(
      { id: 'u1' },
      { data: { notification_enabled: true, notification_threshold_days: 7 }, error: null }
    )
    const res = await GET()
    expect(res.status).toBe(200)
  })
})

describe('PATCH /api/settings/notifications', () => {
  beforeEach(() => vi.mocked(createServerSupabaseClient).mockReset())

  function patchRequest(body: unknown) {
    return new NextRequest('http://localhost/api/settings/notifications', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  test('returns 401 when unauthenticated', async () => {
    mockSupabase(null, { data: null, error: null })
    const res = await PATCH(patchRequest({ notification_enabled: false }))
    expect(res.status).toBe(401)
  })

  test('returns 400 when notification_enabled is not a boolean', async () => {
    mockSupabase({ id: 'u1' }, { data: null, error: null })
    const res = await PATCH(patchRequest({ notification_enabled: 'yes' }))
    expect(res.status).toBe(400)
  })

  test('returns 400 when notification_threshold_days is out of range', async () => {
    mockSupabase({ id: 'u1' }, { data: null, error: null })
    const tooLow = await PATCH(patchRequest({ notification_threshold_days: 0 }))
    expect(tooLow.status).toBe(400)
    const tooHigh = await PATCH(patchRequest({ notification_threshold_days: 366 }))
    expect(tooHigh.status).toBe(400)
  })

  test('returns 400 when no valid fields are provided', async () => {
    mockSupabase({ id: 'u1' }, { data: null, error: null })
    const res = await PATCH(patchRequest({}))
    expect(res.status).toBe(400)
  })

  test('updates settings for a valid payload', async () => {
    mockSupabase(
      { id: 'u1' },
      { data: { notification_enabled: false, notification_threshold_days: 14 }, error: null }
    )
    const res = await PATCH(patchRequest({ notification_enabled: false, notification_threshold_days: 14 }))
    expect(res.status).toBe(200)
  })
})
