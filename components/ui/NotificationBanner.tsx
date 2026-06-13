'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface NotificationStatus {
  shouldNotify: boolean
  daysSinceLastWork: number | null
  notificationEnabled: boolean
  thresholdDays: number
}

export default function NotificationBanner() {
  const [status, setStatus] = useState<NotificationStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let isMounted = true

    fetch('/api/notifications/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: NotificationStatus | null) => {
        if (isMounted && data) setStatus(data)
      })
      .catch(() => {
        // 通知ステータスの取得失敗時はバナーを表示しない（致命的ではないため）
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (dismissed || !status?.shouldNotify) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
        <p className="text-amber-800">
          最後の作品登録から{status.daysSinceLastWork}日経過しています。新しい作品を記録してみましょう。
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/archive/new"
            className="text-amber-900 font-medium underline hover:no-underline"
          >
            作品を登録する
          </Link>
          <button
            onClick={() => setDismissed(true)}
            aria-label="通知を閉じる"
            className="text-amber-500 hover:text-amber-700 transition"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
