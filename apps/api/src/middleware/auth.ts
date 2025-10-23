import type { NextFunction, Request, Response } from 'express'
import type { User } from '@prisma/client'
import { prisma } from '../lib/prisma'

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Request {
      user?: User
    }
  }
}

const USER_HEADER = 'x-user-id'

/**
 * Authentication middleware
 * TODO: Replace with real JWT/session auth implementation.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.headers[USER_HEADER] as string | undefined

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized - User ID required' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' })
    }

    req.user = user
    return next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({ success: false, error: 'Authentication failed' })
  }
}

/**
 * Require that the authenticated user has a configured Nehtw API key.
 */
export function requireNehtwKey(req: Request, res: Response, next: NextFunction) {
  const user = req.user as (User & { nehtwApiKey?: string | null }) | undefined

  if (!user?.nehtwApiKey) {
    return res.status(400).json({
      success: false,
      error: 'Nehtw API key not configured. Please add your API key in settings.',
    })
  }

  return next()
}
