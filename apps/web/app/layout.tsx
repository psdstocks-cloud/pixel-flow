import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'PixelFlow - All your creative workflows in one place',
  description: 'Stock images, AI generation, and design tools for visual artists. Pay per use with credits that never expire.',
  keywords: ['stock images', 'AI image generation', 'background removal', 'visual design tools'],
  authors: [{ name: 'PixelFlow' }],
  openGraph: {
    title: 'PixelFlow - All your creative workflows in one place',
    description: 'Stock images, AI generation, and design tools for visual artists.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
