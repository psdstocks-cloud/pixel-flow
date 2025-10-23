import type { NextFunction, Request, Response } from 'express'

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  readonly statusCode: number
  readonly isOperational: boolean

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Global error handler middleware
 * Must be placed AFTER all routes
 */
export function errorHandler(err: Error | APIError, req: Request, res: Response, _next: NextFunction) {
  let statusCode = 500
  let message = 'Internal Server Error'
  let isOperational = false

  if (err instanceof APIError) {
    statusCode = err.statusCode
    message = err.message
    isOperational = err.isOperational
  } else if (err.name === 'ValidationError') {
    statusCode = 400
    message = err.message
    isOperational = true
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401
    message = 'Unauthorized'
    isOperational = true
  }

  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
    isOperational,
  })

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

/**
 * Async handler wrapper to catch errors in async routes
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
