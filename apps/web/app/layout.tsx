import './globals.css'

export const metadata = {
  title: 'Pixel Flow',
  description: 'Stock images, AI generation, and design tools',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}