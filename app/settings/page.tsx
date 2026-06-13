'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'

const MIN_THRESHOLD_DAYS = 1
const MAX_THRESHOLD_DAYS = 365
const DEFAULT_THRESHOLD_DAYS = 7

interface NotificationSettings {
  notification_enabled: boolean
  notification_threshold_days: number
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function SettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  useEffect(() => {
    fetch('/api/settings/notifications')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: NotificationSettings | null) => {
        setSettings(
          data ?? {
            notification_enabled: true,
            notification_threshold_days: DEFAULT_THRESHOLD_DAYS,
          }
        )
        setLoading(false)
      })
      .catch(() => {
        setSettings({
          notification_enabled: true,
          notification_threshold_days: DEFAULT_THRESHOLD_DAYS,
        })
        setLoading(false)
      })
  }, [])

  async function saveSettings(updates: Partial<NotificationSettings>) {
    if (!settings) return

    const next = { ...settings, ...updates }
    setSettings(next)
    setSaveState('saving')

    const res = await fetch('/api/settings/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (res.ok) {
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } else {
      setSaveState('error')
    }
  }

  if (loading || !settings) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold mb-4">設定</h1>
        <p className="text-sm text-neutral-400">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-xl font-bold">設定</h1>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-neutral-700">通知設定</h2>
        <p className="text-sm text-neutral-500">
          作品の登録が一定期間ない場合に、アプリ内でお知らせを表示します。
        </p>

        <div className="border border-neutral-200 rounded-lg p-4 space-y-4 bg-white">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium">通知を有効にする</span>
            <input
              type="checkbox"
              checked={settings.notification_enabled}
              onChange={(e) => saveSettings({ notification_enabled: e.target.checked })}
              className="w-5 h-5 accent-neutral-900"
            />
          </label>

          <div className="flex items-center justify-between gap-4">
            <label htmlFor="threshold-days" className="text-sm font-medium">
              未登録期間のしきい値
            </label>
            <div className="flex items-center gap-2">
              <input
                id="threshold-days"
                type="number"
                min={MIN_THRESHOLD_DAYS}
                max={MAX_THRESHOLD_DAYS}
                value={settings.notification_threshold_days}
                disabled={!settings.notification_enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notification_threshold_days: Number(e.target.value),
                  })
                }
                onBlur={(e) => {
                  const value = Math.min(
                    MAX_THRESHOLD_DAYS,
                    Math.max(MIN_THRESHOLD_DAYS, Number(e.target.value) || DEFAULT_THRESHOLD_DAYS)
                  )
                  saveSettings({ notification_threshold_days: value })
                }}
                className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm w-20 text-right outline-none focus:ring-2 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-400"
              />
              <span className="text-sm text-neutral-500">日</span>
            </div>
          </div>

          <div className="text-xs h-4">
            {saveState === 'saving' && <span className="text-neutral-400">保存中...</span>}
            {saveState === 'saved' && <span className="text-emerald-600">保存しました</span>}
            {saveState === 'error' && <span className="text-red-500">保存に失敗しました</span>}
          </div>
        </div>
      </section>
    </div>
  )
}
