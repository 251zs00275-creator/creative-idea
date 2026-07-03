import { beforeEach, describe, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
  })),
}))

import { proxy } from './proxy'

function request(path: string) {
  return new NextRequest(`http://localhost:3000${path}`)
}

describe('proxy (auth guard)', () => {
  beforeEach(() => {
    getUserMock.mockReset()
  })

  test('redirects unauthenticated users away from a protected page', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const res = await proxy(request('/archive'))
    expect(res.headers.get('location')).toContain('/login')
  })

  test('redirects unauthenticated users away from /settings too', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const res = await proxy(request('/settings'))
    expect(res.headers.get('location')).toContain('/login')
  })

  // Regression guard for the original bug: PUBLIC_PATHS included '/' and used
  // pathname.startsWith(p), so every path (which always starts with '/')
  // matched and isPublic was always true. This must NOT pass through.
  test('does not treat "/" as a prefix match for unrelated protected paths', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const res = await proxy(request('/archive/new'))
    expect(res.headers.get('location')).toContain('/login')
  })

  test('allows unauthenticated access to the landing page', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const res = await proxy(request('/'))
    expect(res.headers.get('location')).toBeNull()
  })

  test('allows unauthenticated access to the login page', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const res = await proxy(request('/login'))
    expect(res.headers.get('location')).toBeNull()
  })

  test('allows unauthenticated access to API routes (they authenticate themselves)', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
    const res = await proxy(request('/api/works'))
    expect(res.headers.get('location')).toBeNull()
  })

  test('redirects an authenticated user away from /login to /archive', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const res = await proxy(request('/login'))
    expect(res.headers.get('location')).toContain('/archive')
  })

  test('allows an authenticated user to access a protected page', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const res = await proxy(request('/archive'))
    expect(res.headers.get('location')).toBeNull()
  })
})
