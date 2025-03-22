import { LikedPapersProvider } from '@/context/LikedPapersContext'
import { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NerdTok',
  description: 'Explore Computer Science Research Papers and Articles in a TikTok-style interface',
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
