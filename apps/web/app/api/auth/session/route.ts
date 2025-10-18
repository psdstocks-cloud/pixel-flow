import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'

const AUTH_BASE_URL = process.env.NEXTAUTH_URL

if (!AUTH_BASE_URL) {
  throw new Error('NEXTAUTH_URL is not configured. Set it to your authentication backend URL.')
}

const SESSION_URL = new URL('/api/auth/session', AUTH_BASE_URL)

function buildCookieHeader() {
  const cookieStore = cookies().getAll()
  if (cookieStore.length === 0) return undefined
  return cookieStore.map(({ name, value }) => `${name}=${value}`).join('; ')
}

function buildForwardHeaders(request: Request) {
  const incoming = headers()
  const headerEntries: Record<string, string> = {
    accept: 'application/json',
    'user-agent': incoming.get('user-agent') ?? 'pixel-flow-web',
  }

  const cookieHeader = buildCookieHeader()
  if (cookieHeader) {
    headerEntries.cookie = cookieHeader
  }

  const forwardedFor = incoming.get('x-forwarded-for') ?? request.headers.get('x-real-ip')
  if (forwardedFor) {
    headerEntries['x-forwarded-for'] = forwardedFor
  }

  const forwardedProto =
    incoming.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https')
  headerEntries['x-forwarded-proto'] = forwardedProto

  const authorization = incoming.get('authorization') ?? request.headers.get('authorization')
  if (authorization) {
    headerEntries.authorization = authorization
  }

  return headerEntries
}

async function proxySessionRequest(request: Request) {
  const response = await fetch(SESSION_URL, {
    method: 'GET',
    headers: buildForwardHeaders(request),
    cache: 'no-store',
    credentials: 'include',
  })

  const responseBody = await response.text()
  const proxyHeaders = new Headers()
  const contentType = response.headers.get('content-type') ?? 'application/json'
  proxyHeaders.set('content-type', contentType)

  const setCookie = response.headers.get('set-cookie')
  if (setCookie) {
    proxyHeaders.append('set-cookie', setCookie)
  }

  return new NextResponse(responseBody, {
    status: response.status,
    headers: proxyHeaders,
  })
}

export async function GET(request: Request) {
  try {
    return await proxySessionRequest(request)
  } catch (error) {
    console.error('[session-proxy] Failed to load session', error)
    return NextResponse.json({ error: 'SessionUnavailable' }, { status: 502 })
  }
}
