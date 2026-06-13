import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const MS_PER_DAY = 1000 * 60 * 60 * 24

// GET /api/notifications/status
// 「最終作品登録日からの経過日数」が設定した閾値を超えているかどうかを返す
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: settings, error: settingsError } = await supabase
    .from('users')
    .select('notification_enabled, notification_threshold_days')
    .eq('id', user.id)
    .single()

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 })
  }

  const { data: latestWork, error: workError } = await supabase
    .from('works')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (workError) {
    return NextResponse.json({ error: workError.message }, { status: 500 })
  }

  const { notification_enabled, notification_threshold_days } = settings

  // 作品が1件も登録されていない場合は通知対象外（最初の登録を促すUIは別途アーカイブ側にあるため）
  if (!latestWork) {
    return NextResponse.json({
      shouldNotify: false,
      daysSinceLastWork: null,
      notificationEnabled: notification_enabled,
      thresholdDays: notification_threshold_days,
    })
  }

  const lastCreatedAt = new Date(latestWork.created_at).getTime()
  const daysSinceLastWork = Math.floor((Date.now() - lastCreatedAt) / MS_PER_DAY)

  const shouldNotify =
    notification_enabled && daysSinceLastWork >= notification_threshold_days

  return NextResponse.json({
    shouldNotify,
    daysSinceLastWork,
    notificationEnabled: notification_enabled,
    thresholdDays: notification_threshold_days,
  })
}
