import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const { createBrowserClientMock } = vi.hoisted(() => ({
  createBrowserClientMock: vi.fn(() => ({ mocked: true })),
}))

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: createBrowserClientMock,
}))

import { createClient } from './supabase-client'

describe('createClient', () => {
  beforeEach(() => {
    createBrowserClientMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('uses the real env vars when both are present', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://real-project.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'real-anon-key')

    createClient()

    expect(createBrowserClientMock).toHaveBeenCalledWith(
      'https://real-project.supabase.co',
      'real-anon-key'
    )
  })

  test('falls back to a placeholder client outside production when env vars are missing', () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

    expect(() => createClient()).not.toThrow()
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      'https://placeholder.supabase.co',
      'placeholder-anon-key'
    )
  })

  test('throws instead of silently using a placeholder when env vars are missing in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

    expect(() => createClient()).toThrow()
    expect(createBrowserClientMock).not.toHaveBeenCalled()
  })
})
