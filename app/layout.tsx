import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Creative Sense Archive',
  description: 'クリエイティブ感性アーカイブ & 言語化支援サービス',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-neutral-50 text-neutral-900 flex flex-col">
        {children}
      </body>
    </html>
  )
}
