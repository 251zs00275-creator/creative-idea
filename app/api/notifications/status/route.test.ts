import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(),
}))

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { GET } from './route'

type QueryResult = { data: unknown; error: { message: string } | null }

function createQueryBuilderMock(result: QueryResult) {
  const builder: Record<string, unknown> = {}
  const chain = () => builder
  builder.select = vi.fn(chain)
  builder.eq = vi.fn(chain)
  builder.order = vi.fn(chain)
  builder.limit = vi.fn(chain)
  builder.single = vi.fn(() => Promise.resolve(result))
  builder.maybeSingle = vi.fn(() => Promise.resolve(result))
  return builder
}

function mockSupabase(
  user: { id: string } | null,
  results: { users: QueryResult; works: QueryResult }
) {
  const client = {
    auth: { getUser: vi.fn(async () => ({ data: { user } })) },
    from: vi.fn((table: string) =>
      createQueryBuilderMock(table === 'users' ? results.users : results.works)
    ),
  }
  vi.mocked(createServerSupabaseClient).mockResolvedValue(
    client as unknown as Awaited<ReturnType<typeof createServerSupabaseClient>>
  )
}

describe('GET /api/notifications/status', () => {
  beforeEach(() => vi.mocked(createServerSupabaseClient).mockReset())

  test('returns 401 when unauthenticated', async () => {
    mockSupabase(null, {
      users: { data: null, error: null },
      works: { data: null, error: null },
    })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  test('does not notify when the user has no works yet', async () => {
    mockSupabase(
      { id: 'u1' },
      {
        users: { data: { notification_enabled: true, notification_threshold_days: 7 }, error: null },
        works: { data: null, error: null },
      }
    )
    const res = await GET()
    const body = await res.json()
    expect(body.shouldNotify).toBe(false)
    expect(body.daysSinceLastWork).toBeNull()
  })

  test('notifies when days since last work meets or exceeds the threshold', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    mockSupabase(
      { id: 'u1' },
      {
        users: { data: { notification_enabled: true, notification_threshold_days: 7 }, error: null },
        works: { data: { created_at: tenDaysAgo }, error: null },
      }
    )
    const res = await GET()
    const body = await res.json()
    expect(body.shouldNotify).toBe(true)
    expect(body.daysSinceLastWork).toBeGreaterThanOrEqual(10)
  })

  test('does not notify when notifications are disabled even if overdue', async () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    mockSupabase(
      { id: 'u1' },
      {
        users: { data: { notification_enabled: false, notification_threshold_days: 7 }, error: null },
        works: { data: { created_at: tenDaysAgo }, error: null },
      }
    )
    const res = await GET()
    const body = await res.json()
    expect(body.shouldNotify).toBe(false)
  })
})
