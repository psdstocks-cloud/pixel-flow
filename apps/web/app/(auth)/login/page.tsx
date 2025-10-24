'use client'

export const dynamic = 'force-dynamic'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateEmail } from '@/lib/validators'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate email
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // ✅ ADD THIS SECTION AFTER SUCCESSFUL LOGIN
      // Check for pending purchase from pricing page
      const pendingPurchase = localStorage.getItem('pendingPurchase')
      
      if (pendingPurchase) {
        // User came from pricing page → redirect to payment
        const purchase = JSON.parse(pendingPurchase)
        localStorage.removeItem('pendingPurchase') // Clear after reading
        
        router.push(
          `/payment?plan=${purchase.plan}&cycle=${purchase.cycle}&totalPrice=${purchase.totalPrice}&credits=${purchase.credits}`
        )
      } else {
        // Regular login → go to dashboard
        router.push('/dashboard/stock/order-v2')
      }
      // ✅ END OF ADDED SECTION
      
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
    }
  }

  return (
    <div className="w-full">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            PixelFlow
          </h1>
          <p className="text-white/70 text-lg">Welcome back!</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              required
              className="peer w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all duration-300"
            />
            <label
              htmlFor="email"
              className="absolute left-4 -top-2.5 bg-gradient-to-r from-purple-900 to-blue-900 px-2 text-white/70 text-sm transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/50 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-purple-300"
            >
              Email Address
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              required
              className="peer w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all duration-300"
            />
            <label
              htmlFor="password"
              className="absolute left-4 -top-2.5 bg-gradient-to-r from-purple-900 to-blue-900 px-2 text-white/70 text-sm transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/50 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-purple-300"
            >
              Password
            </label>
          </div>

          <div className="flex justify-end">
            <Link 
              href="/forgot-password" 
              className="text-sm text-blue-300 hover:text-blue-200 transition-colors duration-200"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-white/50">Or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl backdrop-blur-sm transition-all duration-300 flex items-center justify-center gap-3 group"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="text-center mt-8 text-white/70">
          Don&apos;t have an account?{' '}
          <Link 
            href="/signup" 
            className="text-blue-300 hover:text-blue-200 font-semibold transition-colors duration-200"
          >
            Sign up
          </Link>
        </p>
      </div>

      <p className="text-center mt-6 text-white/50 text-sm">
        All your creative workflows in one place
      </p>
    </div>
  )
}
