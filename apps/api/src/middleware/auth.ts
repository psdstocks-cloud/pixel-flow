import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import { prisma } from '@pixel-flow/database'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

/**
 * Authentication middleware - validates Supabase JWT tokens
 * Extracts user from token and attaches to req.user
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header' 
      })
    }

    const token = authHeader.replace('Bearer ', '')

    // Validate token with Supabase Admin
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token' 
      })
    }

    // Attach user to request object
    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Authentication failed' 
    })
  }
}

/**
 * Role-based authorization middleware
 * Must be used after requireAuth
 * 
 * @param allowedRoles - Array of roles that can access the route
 * @example app.get('/admin', requireAuth, requireRole(['admin']), handler)
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Authentication required' 
        })
      }

      // Fetch user profile from database
      const profile = await prisma.profile.findUnique({
        where: { id: req.user.id },
        select: { role: true }
      })

      if (!profile) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'User profile not found' 
        })
      }

      // Check if user has required role
      if (!allowedRoles.includes(profile.role)) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
        })
      }

      next()
    } catch (error) {
      console.error('Role check error:', error)
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Authorization failed' 
      })
    }
  }
}
