export const dynamic = 'force-dynamic'
'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handlePasswordReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      router.push('/login?message=Password updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            New Password
          </h1>
          <p className="text-white/70 text-lg">
            Choose a strong password for your account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div className="relative">
            <input
              type="password"
              id="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              required
              minLength={8}
              className="peer w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all duration-300"
            />
            <label
              htmlFor="new-password"
              className="absolute left-4 -top-2.5 bg-gradient-to-r from-purple-900 to-blue-900 px-2 text-white/70 text-sm transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/50 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-purple-300"
            >
              New Password (min. 8 characters)
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              id="confirm-new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder=" "
              required
              minLength={8}
              className="peer w-full px-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-transparent transition-all duration-300"
            />
            <label
              htmlFor="confirm-new-password"
              className="absolute left-4 -top-2.5 bg-gradient-to-r from-purple-900 to-blue-900 px-2 text-white/70 text-sm transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/50 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-purple-300"
            >
              Confirm New Password
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
