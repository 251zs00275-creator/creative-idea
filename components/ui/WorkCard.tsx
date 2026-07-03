import Link from 'next/link'
import Image from 'next/image'
import { Work } from '@/types'
import { CATEGORY_LABELS, FRAMEWORKS } from '@/lib/frameworks'
import { isSupabaseStorageUrl } from '@/lib/image-host'

interface Props {
  work: Work
}

export default function WorkCard({ work }: Props) {
  const framework = work.framework ? FRAMEWORKS[work.framework] : null
  const isOptimizable =
    !!work.thumbnail_url &&
    isSupabaseStorageUrl(work.thumbnail_url, process.env.NEXT_PUBLIC_SUPABASE_URL)

  return (
    <Link
      href={`/archive/${work.id}`}
      className="group block border border-neutral-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-neutral-100 relative overflow-hidden">
        {work.thumbnail_url ? (
          <Image
            src={work.thumbnail_url}
            alt={work.title}
            fill
            className="object-cover group-hover:scale-105 transition"
            unoptimized={!isOptimizable}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl text-neutral-300">
            {categoryEmoji(work.category)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
            {CATEGORY_LABELS[work.category] ?? work.category}
          </span>
          {framework && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {framework.name}
            </span>
          )}
        </div>
        <h2 className="text-sm font-medium leading-snug line-clamp-2">
          {work.title}
        </h2>
        {work.memo && (
          <p className="text-xs text-neutral-500 line-clamp-2">{work.memo}</p>
        )}
        <p className="text-xs text-neutral-400">
          {new Date(work.created_at).toLocaleDateString('ja-JP')}
        </p>
      </div>
    </Link>
  )
}

function categoryEmoji(category: string): string {
  const map: Record<string, string> = {
    movie: '🎬',
    anime: '🎌',
    illustration: '🎨',
    photo: '📷',
    music: '🎵',
    design: '✏️',
    other: '📦',
  }
  return map[category] ?? '📦'
}
