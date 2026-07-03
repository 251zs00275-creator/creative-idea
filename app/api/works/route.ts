import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { workCreateSchema } from '@/lib/validation/work'
import { dbErrorResponse } from '@/lib/api-response'
import { buildPaginatedResponse, parsePagination } from '@/lib/pagination'

// GET /api/works — list works for current user
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const category = searchParams.get('category')
  const framework = searchParams.get('framework')
  const q = searchParams.get('q')
  const pagination = parsePagination(searchParams)

  let query = supabase
    .from('works')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (framework) query = query.eq('framework', framework)
  if (q) {
    // Substring match on title/memo, accelerated by pg_trgm GIN indexes
    // (works_title_trgm / works_memo_trgm in supabase/schema.sql).
    query = query.or(
      `title.ilike.%${q}%,memo.ilike.%${q}%`
    )
  }

  const { data, error, count } = await query.range(pagination.from, pagination.to)

  if (error) {
    return dbErrorResponse('GET /api/works', error)
  }

  return NextResponse.json(buildPaginatedResponse(data ?? [], count ?? 0, pagination))
}

// POST /api/works — create a new work
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = workCreateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? '入力内容が不正です' },
      { status: 400 }
    )
  }

  const { title, category, url, thumbnail_url, memo, framework, ws_answers } = parsed.data

  const { data, error } = await supabase
    .from('works')
    .insert({
      user_id: user.id,
      title,
      category,
      url: url ?? null,
      thumbnail_url: thumbnail_url ?? null,
      memo: memo ?? null,
      framework: framework ?? null,
      ws_answers: ws_answers ?? null,
    })
    .select()
    .single()

  if (error) {
    return dbErrorResponse('POST /api/works', error)
  }

  return NextResponse.json(data, { status: 201 })
}
