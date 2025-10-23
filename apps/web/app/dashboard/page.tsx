export const dynamic = 'force-dynamic'
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-4">
          Welcome to PixelFlow! 🎉
        </h1>
        <p className="text-white/70 text-lg mb-6">
          You have 20 free credits to explore all features. Start by ordering stock images, generating AI content, or removing backgrounds.
        </p>
        <div className="flex gap-4">
          <a 
            href="/stock/order-v2"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300"
          >
            Order Stock Images
          </a>
          <a 
            href="/ai-generation"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all duration-300"
          >
            Generate with AI
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <div className="text-white/60 text-sm mb-2">Available Credits</div>
          <div className="text-3xl font-bold text-white">20</div>
        </div>
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <div className="text-white/60 text-sm mb-2">Images Downloaded</div>
          <div className="text-3xl font-bold text-white">0</div>
        </div>
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <div className="text-white/60 text-sm mb-2">AI Generations</div>
          <div className="text-3xl font-bold text-white">0</div>
        </div>
      </div>
    </div>
  )
}
