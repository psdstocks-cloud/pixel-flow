'use client'

import { useAuth } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Header with User Info */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to PixelFlow! 🎉
            </h1>
            <p className="text-white/60 text-sm">
              {user?.email}
            </p>
          </div>
          <button
            onClick={signOut}
            className="px-6 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 font-semibold rounded-xl transition-all duration-300"
          >
            Sign Out
          </button>
        </div>

        {/* Welcome Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8">
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

        {/* Quick Actions */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/profile"
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300"
            >
              <div className="text-white font-semibold mb-1">Profile Settings</div>
              <div className="text-white/60 text-sm">Manage your account</div>
            </a>
            <a
              href="/orders"
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300"
            >
              <div className="text-white font-semibold mb-1">Order History</div>
              <div className="text-white/60 text-sm">View your purchases</div>
            </a>
            <a
              href="/downloads"
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300"
            >
              <div className="text-white font-semibold mb-1">Downloads</div>
              <div className="text-white/60 text-sm">Access your files</div>
            </a>
            <a
              href="/credits"
              className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300"
            >
              <div className="text-white font-semibold mb-1">Buy Credits</div>
              <div className="text-white/60 text-sm">Top up your balance</div>
            </a>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
