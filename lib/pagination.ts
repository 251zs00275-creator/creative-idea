export const DEFAULT_PAGE_SIZE = 24
export const MAX_PAGE_SIZE = 100

export interface PaginationParams {
  page: number
  pageSize: number
  from: number
  to: number
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  pageSize: number
  totalCount: number
  hasMore: boolean
}

function parsePositiveInt(value: string | null, fallback: number, max?: number): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback
  return max ? Math.min(parsed, max) : parsed
}

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const page = parsePositiveInt(searchParams.get('page'), 1)
  const pageSize = parsePositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  return { page, pageSize, from, to }
}

export function buildPaginatedResponse<T>(
  data: T[],
  totalCount: number,
  { page, pageSize, from }: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    page,
    pageSize,
    totalCount,
    hasMore: from + data.length < totalCount,
  }
}
