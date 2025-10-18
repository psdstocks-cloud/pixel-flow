import type { Request, Response, NextFunction } from 'express'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
  }
}

const USER_HEADER = 'x-user-id'

export function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = req.header(USER_HEADER)
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Missing user identity header.' })
  }

  req.user = { id: userId }
  return next()
}

export function optionalUser(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const userId = req.header(USER_HEADER)
  if (userId) {
    req.user = { id: userId }
  }
  next()
}
