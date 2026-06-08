import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Creative Sense Archive</h1>
      <p className="text-neutral-500 max-w-md text-sm leading-relaxed">
        クリエイティブ作品に触れた瞬間の感性を記録・蓄積し、<br />
        AIによる分析で自己の美的センスを可視化する
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="bg-neutral-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-700 transition"
        >
          はじめる
        </Link>
        <Link
          href="/archive"
          className="border border-neutral-200 px-6 py-2.5 rounded-lg text-sm hover:bg-neutral-100 transition"
        >
          アーカイブを見る
        </Link>
      </div>
    </main>
  )
}
