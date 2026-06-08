'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Category, FrameworkKey, WorksheetAnswers } from '@/types'
import { CATEGORY_LABELS, FRAMEWORK_LIST, getFramework } from '@/lib/frameworks'
import WorksheetForm from '@/components/worksheets/WorksheetForm'

export default function NewWorkPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('movie')
  const [url, setUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [memo, setMemo] = useState('')
  const [framework, setFramework] = useState<FrameworkKey | null>(null)
  const [wsAnswers, setWsAnswers] = useState<WorksheetAnswers>({})
  const [ogpLoading, setOgpLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUrlBlur = async () => {
    if (!url) return
    setOgpLoading(true)
    try {
      const res = await fetch(`/api/ogp?url=${encodeURIComponent(url)}`)
      if (res.ok) {
        const ogp = await res.json()
        if (ogp.title && !title) setTitle(ogp.title)
        if (ogp.image && !thumbnailUrl) setThumbnailUrl(ogp.image)
      }
    } finally {
      setOgpLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) { setError('タイトルは必須です'); return }
    setSaving(true)
    setError(null)

    const res = await fetch('/api/works', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, category, url, thumbnail_url: thumbnailUrl,
        memo, framework, ws_answers: Object.keys(wsAnswers).length ? wsAnswers : null,
      }),
    })

    if (res.ok) {
      const work = await res.json()
      router.push(`/archive/${work.id}`)
    } else {
      const data = await res.json()
      setError(data.error ?? '登録に失敗しました')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-xl font-bold">作品を登録</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL */}
        <div className="space-y-1">
          <label className="text-sm font-medium">URL（任意）</label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
            />
            {ogpLoading && <span className="text-xs text-neutral-400 self-center">取得中...</span>}
          </div>
          {thumbnailUrl && (
            <img src={thumbnailUrl} alt="thumbnail" className="mt-2 h-24 rounded object-cover" />
          )}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <label className="text-sm font-medium">タイトル <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-sm font-medium">カテゴリ <span className="text-red-500">*</span></label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Memo */}
        <div className="space-y-1">
          <label className="text-sm font-medium">最初の一言メモ（任意）</label>
          <textarea
            rows={3}
            placeholder="見た瞬間の感想を自由に..."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
          />
        </div>

        {/* Framework */}
        <div className="space-y-3">
          <label className="text-sm font-medium">言語化フレームワーク <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FRAMEWORK_LIST.map((fw) => (
              <button
                key={fw.key}
                type="button"
                onClick={() => { setFramework(fw.key); setWsAnswers({}) }}
                className={`text-left p-3 rounded-lg border transition ${
                  framework === fw.key
                    ? 'border-neutral-900 bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-400'
                }`}
              >
                <div className="text-sm font-medium">{fw.name}</div>
                <div className="text-xs text-neutral-500 mt-0.5">{fw.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Worksheet */}
        {framework && (
          <WorksheetForm
            framework={getFramework(framework)}
            answers={wsAnswers}
            onChange={setWsAnswers}
          />
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-neutral-200 rounded-lg px-4 py-2.5 text-sm hover:bg-neutral-50 transition"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving || !framework}
            className="flex-1 bg-neutral-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-neutral-700 transition disabled:opacity-50"
          >
            {saving ? '保存中...' : '登録する'}
          </button>
        </div>
      </form>
    </div>
  )
}
