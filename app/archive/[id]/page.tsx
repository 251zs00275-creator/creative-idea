'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Work, WorksheetAnswers } from '@/types'
import { CATEGORY_LABELS, FRAMEWORKS } from '@/lib/frameworks'
import { buildSnsSummary } from '@/lib/export'
import { uploadThumbnail, ThumbnailUploadError } from '@/lib/upload'
import { isSupabaseStorageUrl } from '@/lib/image-host'
import WorksheetForm from '@/components/worksheets/WorksheetForm'

export default function WorkDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [work, setWork] = useState<Work | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  const [thumbnailError, setThumbnailError] = useState<string | null>(null)
  const [editingWorksheet, setEditingWorksheet] = useState(false)
  const [draftAnswers, setDraftAnswers] = useState<WorksheetAnswers>({})
  const [savingWorksheet, setSavingWorksheet] = useState(false)
  const [worksheetError, setWorksheetError] = useState<string | null>(null)

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

  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !work) return

    setThumbnailUploading(true)
    setThumbnailError(null)

    try {
      const publicUrl = await uploadThumbnail(file)
      const res = await fetch(`/api/works/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thumbnail_url: publicUrl }),
      })
      if (!res.ok) throw new ThumbnailUploadError('サムネイルの保存に失敗しました')
      const updated = await res.json()
      setWork(updated)
    } catch (err) {
      setThumbnailError(err instanceof ThumbnailUploadError ? err.message : '画像のアップロードに失敗しました')
    } finally {
      setThumbnailUploading(false)
      e.target.value = ''
    }
  }

  const handleStartEditWorksheet = () => {
    if (!work) return
    setDraftAnswers(work.ws_answers ?? {})
    setWorksheetError(null)
    setEditingWorksheet(true)
  }

  const handleCancelEditWorksheet = () => {
    setEditingWorksheet(false)
    setWorksheetError(null)
  }

  const handleSaveWorksheet = async () => {
    setSavingWorksheet(true)
    setWorksheetError(null)

    const res = await fetch(`/api/works/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ws_answers: draftAnswers }),
    })

    if (res.ok) {
      const updated = await res.json()
      setWork(updated)
      setEditingWorksheet(false)
    } else {
      const data = await res.json().catch(() => null)
      setWorksheetError(data?.error ?? '保存に失敗しました')
    }
    setSavingWorksheet(false)
  }

  const handleCopySnsText = async () => {
    if (!work) return
    await navigator.clipboard.writeText(buildSnsSummary(work))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            unoptimized={!isSupabaseStorageUrl(work.thumbnail_url, process.env.NEXT_PUBLIC_SUPABASE_URL)}
          />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm text-neutral-500 cursor-pointer hover:text-neutral-900 transition inline-flex items-center gap-1">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleThumbnailFileChange}
            disabled={thumbnailUploading}
            className="hidden"
          />
          {thumbnailUploading
            ? 'アップロード中...'
            : work.thumbnail_url
              ? 'サムネイルを変更'
              : 'サムネイル画像を追加'}
        </label>
        {thumbnailError && <p className="text-xs text-red-500">{thumbnailError}</p>}
      </div>

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
      {framework && (
        <div className="space-y-3">
          <WorksheetForm
            framework={framework}
            answers={editingWorksheet ? draftAnswers : work.ws_answers ?? {}}
            onChange={setDraftAnswers}
            readOnly={!editingWorksheet}
          />

          {worksheetError && <p className="text-sm text-red-500">{worksheetError}</p>}

          <div className="flex justify-end gap-2">
            {editingWorksheet ? (
              <>
                <button
                  onClick={handleCancelEditWorksheet}
                  disabled={savingWorksheet}
                  className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 hover:bg-neutral-50 transition disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveWorksheet}
                  disabled={savingWorksheet}
                  className="text-sm bg-neutral-900 text-white rounded-lg px-3 py-1.5 hover:bg-neutral-700 transition disabled:opacity-50"
                >
                  {savingWorksheet ? '保存中...' : '保存'}
                </button>
              </>
            ) : (
              <button
                onClick={handleStartEditWorksheet}
                className="text-sm text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition"
              >
                ワークシートを編集
              </button>
            )}
          </div>
        </div>
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
          onClick={handleCopySnsText}
          className="text-sm text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition"
        >
          {copied ? 'コピーしました' : 'SNS用テキストをコピー'}
        </button>
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
