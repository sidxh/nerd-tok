import { LikedPapersProvider } from '@/context/LikedPapersContext'
import { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ArXivTok',
  description: 'Explore arXiv papers in a TikTok-style interface',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LikedPapersProvider>
          {children}
        </LikedPapersProvider>
      </body>
    </html>
  )
}
