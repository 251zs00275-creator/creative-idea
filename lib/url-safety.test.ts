import { beforeEach, describe, expect, test, vi } from 'vitest'

const { lookupMock } = vi.hoisted(() => ({ lookupMock: vi.fn() }))

vi.mock('node:dns/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:dns/promises')>()
  return { ...actual, lookup: lookupMock }
})

import { assertSafeUrl, UnsafeUrlError } from './url-safety'

describe('assertSafeUrl', () => {
  beforeEach(() => {
    lookupMock.mockReset()
  })

  test('rejects malformed URLs', async () => {
    await expect(assertSafeUrl('not-a-url')).rejects.toThrow(UnsafeUrlError)
  })

  test('rejects non-http(s) schemes', async () => {
    await expect(assertSafeUrl('ftp://example.com/')).rejects.toThrow(UnsafeUrlError)
    await expect(assertSafeUrl('file:///etc/passwd')).rejects.toThrow(UnsafeUrlError)
  })

  test('rejects localhost by hostname without a DNS lookup', async () => {
    await expect(assertSafeUrl('http://localhost/')).rejects.toThrow(UnsafeUrlError)
    await expect(assertSafeUrl('http://sub.localhost/')).rejects.toThrow(UnsafeUrlError)
    expect(lookupMock).not.toHaveBeenCalled()
  })

  test('rejects IPv4 loopback and private ranges given as literals', async () => {
    await expect(assertSafeUrl('http://127.0.0.1/')).rejects.toThrow(UnsafeUrlError)
    await expect(assertSafeUrl('http://10.0.0.5/')).rejects.toThrow(UnsafeUrlError)
    await expect(assertSafeUrl('http://172.16.0.1/')).rejects.toThrow(UnsafeUrlError)
    await expect(assertSafeUrl('http://192.168.1.1/')).rejects.toThrow(UnsafeUrlError)
  })

  test('rejects the cloud metadata link-local address', async () => {
    await expect(assertSafeUrl('http://169.254.169.254/')).rejects.toThrow(UnsafeUrlError)
  })

  test('rejects IPv6 loopback literal', async () => {
    await expect(assertSafeUrl('http://[::1]/')).rejects.toThrow(UnsafeUrlError)
  })

  test('rejects a hostname that resolves to a private IP', async () => {
    lookupMock.mockResolvedValue([{ address: '10.1.2.3', family: 4 }])
    await expect(assertSafeUrl('http://internal.example.com/')).rejects.toThrow(UnsafeUrlError)
  })

  test('allows a hostname that resolves only to public IPs', async () => {
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])
    await expect(assertSafeUrl('https://example.com/')).resolves.toBeUndefined()
  })

  test('rejects when any of multiple resolved addresses is private', async () => {
    lookupMock.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ])
    await expect(assertSafeUrl('https://mixed.example.com/')).rejects.toThrow(UnsafeUrlError)
  })
})
