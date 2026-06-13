import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const MIN_THRESHOLD_DAYS = 1
const MAX_THRESHOLD_DAYS = 365

// GET /api/settings/notifications — fetch current user's notification settings
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('users')
    .select('notification_enabled, notification_threshold_days')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PATCH /api/settings/notifications — update current user's notification settings
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if ('notification_enabled' in body) {
    if (typeof body.notification_enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'notification_enabled must be a boolean' },
        { status: 400 }
      )
    }
    updates.notification_enabled = body.notification_enabled
  }

  if ('notification_threshold_days' in body) {
    const threshold = Number(body.notification_threshold_days)
    if (
      !Number.isInteger(threshold) ||
      threshold < MIN_THRESHOLD_DAYS ||
      threshold > MAX_THRESHOLD_DAYS
    ) {
      return NextResponse.json(
        {
          error: `notification_threshold_days must be an integer between ${MIN_THRESHOLD_DAYS} and ${MAX_THRESHOLD_DAYS}`,
        },
        { status: 400 }
      )
    }
    updates.notification_threshold_days = threshold
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select('notification_enabled, notification_threshold_days')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
