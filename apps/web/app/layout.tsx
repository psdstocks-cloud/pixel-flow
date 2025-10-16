import './globals.css'
import { AppProviders } from './providers'

export const metadata = {
  title: 'Pixel Flow',
  description: 'Stock images, AI generation, and design tools',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}