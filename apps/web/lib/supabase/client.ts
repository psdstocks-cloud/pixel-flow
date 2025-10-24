/**
 * Centralized Supabase Client Factory
 * Ensures consistent configuration across the app
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Auto-refresh tokens before they expire
        autoRefreshToken: true,
        // Persist session in local storage
        persistSession: true,
        // Detect session from URL (for email confirmations, password resets)
        detectSessionInUrl: true,
        // Custom storage key
        storageKey: 'pixel-flow-auth',
        // Flow type for PKCE (more secure than implicit)
        flowType: 'pkce'
      },
      // Global headers for all requests
      global: {
        headers: {
          'x-client-info': 'pixel-flow-web@2.0.0'
        }
      }
    }
  )
}
