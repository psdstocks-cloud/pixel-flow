'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Stock Order', path: '/stock/order-v2', icon: '🖼️' },
    { name: 'Downloads', path: '/download', icon: '⬇️' },
    { name: 'AI Generation', path: '/ai-generation', icon: '🎨' },
    { name: 'Account Insights', path: '/account-insights', icon: '📈' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Glassmorphic Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 backdrop-blur-xl bg-white/10 border-r border-white/20 p-6">
        {/* Logo */}
        <Link href="/dashboard" className="block mb-10">
          <h1 className="text-2xl font-bold text-white">PixelFlow</h1>
          <p className="text-white/60 text-sm">Dashboard</p>
        </Link>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path || pathname?.startsWith(item.path)
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="absolute bottom-6 left-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-all duration-200"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Sign Out</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 min-h-screen">
        {/* Glassmorphic Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/5 border-b border-white/10 px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {navItems.find(item => pathname === item.path || pathname?.startsWith(item.path))?.name || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-4">
              {/* Credits Badge */}
              <div className="px-4 py-2 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 font-semibold">
                20 Credits
              </div>
              {/* User Avatar Placeholder */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold">
                U
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
