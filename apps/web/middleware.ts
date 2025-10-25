import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ============================================
  // AUTHENTICATION & SESSION REFRESH
  // ============================================

  // CRITICAL: Use getUser() instead of getSession()
  // getUser() validates with auth server (more secure)
  // getSession() only checks local storage (can be spoofed)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Also get session for token refresh
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes - redirect to login if not authenticated
  const protectedRoutes = ['/dashboard', '/profile', '/orders', '/admin', '/downloads']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect to login if accessing protected route without valid user
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    console.log(`🔒 Protected route access denied: ${request.nextUrl.pathname}`)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages
  const authPages = ['/login', '/signup']
  if (authPages.includes(request.nextUrl.pathname) && user) {
    console.log(`✅ Authenticated user redirected from ${request.nextUrl.pathname} to /dashboard`)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Log session refresh for monitoring
  if (session && user) {
    const expiresIn = session.expires_at ? session.expires_at - Math.floor(Date.now() / 1000) : 0
    if (expiresIn < 300) { // Less than 5 minutes
      console.log(`🔄 Session expiring soon (${Math.floor(expiresIn / 60)}min) - will auto-refresh`)
    }
  }

  // ============================================
  // SECURITY HEADERS - XSS & DATA EXFILTRATION PROTECTION
  // ============================================

  // Content Security Policy (CSP) - Prevents XSS attacks
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://apis.google.com https://*.railway.app https://pixel-flow-production.up.railway.app",
    "frame-src 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ].join('; ')

  supabaseResponse.headers.set('Content-Security-Policy', cspHeader)

  // X-Frame-Options - Prevents clickjacking attacks
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')

  // X-Content-Type-Options - Prevents MIME sniffing
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')

  // X-XSS-Protection - Legacy XSS protection (for older browsers)
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer-Policy - Controls referrer information
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy - Restricts browser features
  supabaseResponse.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Strict-Transport-Security (HSTS) - Forces HTTPS
  // Only add in production (Vercel handles this automatically)
  if (process.env.NODE_ENV === 'production') {
    supabaseResponse.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
