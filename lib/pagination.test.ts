import { describe, expect, test } from 'vitest'
import { buildPaginatedResponse, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, parsePagination } from './pagination'

function params(query: string) {
  return new URLSearchParams(query)
}

describe('parsePagination', () => {
  test('defaults to page 1 and the default page size when nothing is specified', () => {
    const result = parsePagination(params(''))
    expect(result).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE, from: 0, to: DEFAULT_PAGE_SIZE - 1 })
  })

  test('computes from/to for a given page and pageSize', () => {
    const result = parsePagination(params('page=3&pageSize=10'))
    expect(result).toEqual({ page: 3, pageSize: 10, from: 20, to: 29 })
  })

  test('falls back to page 1 for non-positive or non-numeric page values', () => {
    expect(parsePagination(params('page=0')).page).toBe(1)
    expect(parsePagination(params('page=-5')).page).toBe(1)
    expect(parsePagination(params('page=abc')).page).toBe(1)
  })

  test('clamps pageSize to MAX_PAGE_SIZE', () => {
    expect(parsePagination(params('pageSize=9999')).pageSize).toBe(MAX_PAGE_SIZE)
  })

  test('falls back to the default page size for non-positive or non-numeric pageSize', () => {
    expect(parsePagination(params('pageSize=0')).pageSize).toBe(DEFAULT_PAGE_SIZE)
    expect(parsePagination(params('pageSize=abc')).pageSize).toBe(DEFAULT_PAGE_SIZE)
  })
})

describe('buildPaginatedResponse', () => {
  test('sets hasMore to true when more rows remain beyond this page', () => {
    const pagination = parsePagination(params('page=1&pageSize=10'))
    const result = buildPaginatedResponse([{ id: 1 }], 30, pagination)
    expect(result).toEqual({ data: [{ id: 1 }], page: 1, pageSize: 10, totalCount: 30, hasMore: true })
  })

  test('sets hasMore to false on the last page', () => {
    const pagination = parsePagination(params('page=3&pageSize=10'))
    const result = buildPaginatedResponse(Array(10).fill({}), 30, pagination)
    expect(result.hasMore).toBe(false)
  })

  test('sets hasMore to false when there are no results at all', () => {
    const pagination = parsePagination(params(''))
    const result = buildPaginatedResponse([], 0, pagination)
    expect(result.hasMore).toBe(false)
  })
})
