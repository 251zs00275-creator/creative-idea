'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Work } from '@/types'
import { CATEGORY_LABELS, FRAMEWORK_LIST } from '@/lib/frameworks'
import WorkCard from '@/components/ui/WorkCard'

const ALL = '__all__'

function ArchiveContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState(searchParams.get('category') || ALL)
  const [framework, setFramework] = useState(searchParams.get('framework') || ALL)
  const [q, setQ] = useState(searchParams.get('q') || '')

  // Sync filter/search state to the URL query string
  useEffect(() => {
    const params = new URLSearchParams()
    if (category !== ALL) params.set('category', category)
    if (framework !== ALL) params.set('framework', framework)
    if (q) params.set('q', q)

    const query = params.toString()
    router.replace(query ? `/archive?${query}` : '/archive', { scroll: false })
  }, [category, framework, q, router])

  // フィルタ・検索が変わったら1ページ目から取り直す
  useEffect(() => {
    let isCurrent = true

    async function fetchFirstPage() {
      setLoading(true)
      const params = new URLSearchParams()
      if (category !== ALL) params.set('category', category)
      if (framework !== ALL) params.set('framework', framework)
      if (q) params.set('q', q)
      params.set('page', '1')

      const res = await fetch(`/api/works?${params}`)
      const json = res.ok ? await res.json() : { data: [], hasMore: false }

      if (!isCurrent) return
      setWorks(json.data ?? [])
      setHasMore(Boolean(json.hasMore))
      setPage(1)
      setLoading(false)
    }

    fetchFirstPage()

    return () => {
      isCurrent = false
    }
  }, [category, framework, q])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    const nextPage = page + 1
    const params = new URLSearchParams()
    if (category !== ALL) params.set('category', category)
    if (framework !== ALL) params.set('framework', framework)
    if (q) params.set('q', q)
    params.set('page', String(nextPage))

    const res = await fetch(`/api/works?${params}`)
    if (res.ok) {
      const json = await res.json()
      setWorks((prev) => [...prev, ...(json.data ?? [])])
      setHasMore(Boolean(json.hasMore))
      setPage(nextPage)
    }
    setLoadingMore(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">アーカイブ</h1>
        <Link
          href="/archive/new"
          className="bg-neutral-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-neutral-700 transition"
        >
          ＋ 作品を登録
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="タイトル・メモで検索..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900 w-56"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
        >
          <option value={ALL}>すべてのカテゴリ</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={framework}
          onChange={(e) => setFramework(e.target.value)}
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
        >
          <option value={ALL}>すべてのフレームワーク</option>
          {FRAMEWORK_LIST.map((fw) => (
            <option key={fw.key} value={fw.key}>{fw.name} — {fw.description}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-neutral-400 text-sm">読み込み中...</div>
      ) : works.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-neutral-400 text-sm">まだ作品が登録されていません</p>
          <Link
            href="/archive/new"
            className="inline-block text-sm underline text-neutral-600 hover:text-neutral-900"
          >
            最初の作品を登録する →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {works.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-sm border border-neutral-200 rounded-lg px-4 py-2 hover:bg-neutral-50 transition disabled:opacity-50"
              >
                {loadingMore ? '読み込み中...' : 'もっと読み込む'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ArchivePage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-neutral-400 text-sm">読み込み中...</div>}>
      <ArchiveContent />
    </Suspense>
  )
}
