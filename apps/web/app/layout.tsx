export const metadata = {
  title: "Pixel Flow",
  description: "Stock images, AI generation, and design tools",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
