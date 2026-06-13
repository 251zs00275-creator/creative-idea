import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const MAX_DISPLAY_NAME_LENGTH = 50

// GET /api/settings/profile — fetch current user's profile
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('users')
    .select('email, display_name')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PATCH /api/settings/profile — update current user's profile
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  if (!('display_name' in body)) {
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 }
    )
  }

  const displayName = body.display_name

  if (typeof displayName !== 'string' || displayName.trim().length === 0) {
    return NextResponse.json(
      { error: 'display_name must be a non-empty string' },
      { status: 400 }
    )
  }

  if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return NextResponse.json(
      { error: `display_name must be at most ${MAX_DISPLAY_NAME_LENGTH} characters` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('users')
    .update({ display_name: displayName.trim() })
    .eq('id', user.id)
    .select('email, display_name')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
