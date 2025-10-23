import '../globals.css'
import Link from 'next/link'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Simple Header */}
      <header className="backdrop-blur-xl bg-white/10 border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            PixelFlow
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/pricing" className="text-white/70 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/faq" className="text-white/70 hover:text-white transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="text-white/70 hover:text-white transition-colors">
              Contact
            </Link>
            <Link 
              href="/login" 
              className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="container mx-auto px-6 py-12">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="backdrop-blur-xl bg-white/5 border-t border-white/10 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between text-white/60 text-sm">
            <p>© 2025 PixelFlow. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
