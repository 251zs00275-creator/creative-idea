'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

const NAV_LINKS = [
  { href: '/archive', label: 'アーカイブ' },
  { href: '/analysis', label: '自己分析' },
  { href: '/settings', label: '設定' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/archive" className="font-semibold text-sm tracking-tight">
          Creative Sense Archive
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                pathname.startsWith(href)
                  ? 'bg-neutral-100 font-medium'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="ml-2 px-3 py-1.5 rounded-md text-sm text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition"
          >
            ログアウト
          </button>
        </nav>
      </div>
    </header>
  )
}
