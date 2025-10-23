'use client';

import Link from 'next/link';
import { Download, LayoutDashboard, CreditCard } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      {/* Navigation Bar */}
      <nav className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="text-white font-bold text-xl">
              Pixel Flow
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-2">
              <Link 
                href="/pricing" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pricing</span>
              </Link>

              <Link 
                href="/download" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </Link>

              <Link 
                href="/account-insights" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
