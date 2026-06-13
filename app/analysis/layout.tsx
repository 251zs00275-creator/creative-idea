export const dynamic = 'force-dynamic'

import Nav from '@/components/ui/Nav'
import NotificationBanner from '@/components/ui/NotificationBanner'

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <NotificationBanner />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
    </>
  )
}
