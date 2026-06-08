export const dynamic = 'force-dynamic'

import Nav from '@/components/ui/Nav'

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </>
  )
}
