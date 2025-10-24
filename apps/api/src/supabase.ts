import { createClient } from '@supabase/supabase-js'

// Backend uses service role key to bypass RLS when needed
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ NEVER expose this to frontend
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// For user-scoped operations (validates user tokens)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)
