'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Work } from '@/types'
import { CATEGORY_LABELS, FRAMEWORKS } from '@/lib/frameworks'
import WorksheetForm from '@/components/worksheets/WorksheetForm'

export default function WorkDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [work, setWork] = useState<Work | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/works/${id}`)
      .then((r) => r.json())
      .then((data) => { setWork(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('この作品を削除しますか？')) return
    setDeleting(true)
    await fetch(`/api/works/${id}`, { method: 'DELETE' })
    router.push('/archive')
  }

  if (loading) {
    return <div className="text-center py-20 text-neutral-400 text-sm">読み込み中...</div>
  }

  if (!work) {
    return <div className="text-center py-20 text-neutral-400 text-sm">作品が見つかりませんでした</div>
  }

  const framework = work.framework ? FRAMEWORKS[work.framework] : null

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition"
      >
        ← 一覧に戻る
      </button>

      {/* Thumbnail */}
      {work.thumbnail_url && (
        <div className="aspect-video relative rounded-xl overflow-hidden bg-neutral-100">
          <Image
            src={work.thumbnail_url}
            alt={work.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
            {CATEGORY_LABELS[work.category] ?? work.category}
          </span>
          {framework && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {framework.name}
            </span>
          )}
          <span className="text-xs text-neutral-400 ml-auto">
            {new Date(work.created_at).toLocaleDateString('ja-JP')}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{work.title}</h1>
        {work.url && (
          <a
            href={work.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline break-all"
          >
            {work.url}
          </a>
        )}
      </div>

      {/* Memo */}
      {work.memo && (
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-neutral-500">最初の一言</h2>
          <p className="text-sm text-neutral-800 whitespace-pre-wrap bg-neutral-50 rounded-lg px-4 py-3">
            {work.memo}
          </p>
        </div>
      )}

      {/* Worksheet */}
      {framework && work.ws_answers && (
        <WorksheetForm
          framework={framework}
          answers={work.ws_answers}
          onChange={() => {}}
          readOnly
        />
      )}

      {/* Actions */}
      <div className="flex justify-end items-center gap-2 pt-4 border-t border-neutral-100">
        <span className="text-xs text-neutral-400 mr-auto">エクスポート:</span>
        <a
          href={`/api/works/${id}/export?format=md`}
          className="text-sm text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition"
        >
          Markdown
        </a>
        <a
          href={`/api/works/${id}/export?format=pdf`}
          className="text-sm text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition"
        >
          PDF
        </a>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
        >
          {deleting ? '削除中...' : '削除'}
        </button>
      </div>
    </div>
  )
}
