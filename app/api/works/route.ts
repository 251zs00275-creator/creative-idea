import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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

  let query = supabase
    .from('works')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (framework) query = query.eq('framework', framework)
  if (q) {
    query = query.or(
      `title.ilike.%${q}%,memo.ilike.%${q}%`
    )
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/works — create a new work
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, category, url, thumbnail_url, memo, framework, ws_answers } = body

  if (!title || !category) {
    return NextResponse.json(
      { error: 'title and category are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('works')
    .insert({
      user_id: user.id,
      title,
      category,
      url: url || null,
      thumbnail_url: thumbnail_url || null,
      memo: memo || null,
      framework: framework || null,
      ws_answers: ws_answers || null,
      source: 'web',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
