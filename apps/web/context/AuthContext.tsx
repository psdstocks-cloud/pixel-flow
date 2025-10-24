'use client'

/**
 * Auth Context Provider
 * Manages global authentication state with auto-refresh
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
      } catch (error) {
        console.error('Failed to get session:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('🔐 Auth event:', event)

      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ User signed in')
          // Redirect to dashboard if on auth pages
          if (pathname === '/login' || pathname === '/signup') {
            router.push('/dashboard')
          }
          break

        case 'SIGNED_OUT':
          console.log('👋 User signed out')
          setSession(null)
          setUser(null)
          // Redirect to login
          router.push('/login')
          break

        case 'TOKEN_REFRESHED':
          console.log('🔄 Token refreshed successfully')
          break

        case 'USER_UPDATED':
          console.log('👤 User data updated')
          break

        case 'PASSWORD_RECOVERY':
          console.log('🔑 Password recovery initiated')
          router.push('/reset-password')
          break
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, pathname, supabase.auth])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
