import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import { prisma } from '@pixel-flow/database'

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

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

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token' 
      })
    }

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

export function requireRole(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: req.user.id },
      select: { role: true }
    })

    if (!profile || !allowedRoles.includes(profile.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Insufficient permissions' 
      })
    }

    next()
  }
}
