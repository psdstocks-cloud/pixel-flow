/**
 * Global Error Handler Middleware
 * Sanitizes errors and prevents information leakage
 */

import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../lib/errors'
import { logger } from '../lib/logger'
import { handlePrismaError } from '../lib/prisma-error-handler'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log full error details server-side (sanitized)
  logger.error('API Error:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    statusCode: (err as any).statusCode || 500
  })

  // Handle Prisma errors
  if (err.constructor.name.startsWith('Prisma')) {
    const apiError = handlePrismaError(err)
    return res.status(apiError.statusCode).json({
      error: apiError.message,
      code: apiError.code
    })
  }

  // Handle operational errors (known, safe to expose)
  if (err instanceof ApiError && err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code
    })
  }

  // Handle JWT errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    })
  }

  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'Origin not allowed',
      code: 'CORS_ERROR'
    })
  }

  // Default: Never expose internal errors in production
  res.status(500).json({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR'
  })
}
