import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">PixelFlow</h1>
          <nav className="flex items-center gap-6">
            <Link 
              href="/login" 
              className="text-white/70 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h2 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            All your creative workflows in{' '}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              one place
            </span>
          </h2>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto">
            Stock images, AI generation, and design tools for visual artists. Pay per use with credits that never expire.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:-translate-y-1"
            >
              Start for Free
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-lg font-semibold rounded-xl backdrop-blur-sm transition-all duration-300"
            >
              View Pricing
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {/* Feature 1 */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300">
              <div className="text-4xl mb-4">🖼️</div>
              <h3 className="text-xl font-bold text-white mb-3">Stock Images</h3>
              <p className="text-white/70">
                Access millions of high-quality stock images from top providers.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-white mb-3">AI Generation</h3>
              <p className="text-white/70">
                Create stunning AI-generated images with the latest models.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300">
              <div className="text-4xl mb-4">✂️</div>
              <h3 className="text-xl font-bold text-white mb-3">Design Tools</h3>
              <p className="text-white/70">
                Background removal, upscaling, and more creative tools.
              </p>
            </div>
          </div>

          {/* Pricing Preview */}
          <div className="mt-20 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Simple Pay-Per-Use Pricing</h3>
            <p className="text-white/70 mb-6">
              Start with 20 free credits. Buy more credits anytime – they never expire.
            </p>
            <div className="flex justify-center gap-8 text-white">
              <div>
                <div className="text-3xl font-bold">20</div>
                <div className="text-white/60">Free Credits</div>
              </div>
              <div>
                <div className="text-3xl font-bold">$0.10</div>
                <div className="text-white/60">Per Credit</div>
              </div>
              <div>
                <div className="text-3xl font-bold">∞</div>
                <div className="text-white/60">No Expiration</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 backdrop-blur-xl bg-white/5 border-t border-white/10 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between text-white/60 text-sm">
            <p>© 2025 PixelFlow. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
