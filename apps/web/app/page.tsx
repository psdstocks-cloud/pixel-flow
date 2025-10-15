export default function HomePage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Pixel Flow</h1>
      <p>Next.js app is running. Connect API at {process.env.NEXT_PUBLIC_API_BASE_URL}.</p>
    </main>
  )
}
