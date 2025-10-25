/**
 * Audit Logging Middleware
 * Automatically logs sensitive API access
 */

import { Request, Response, NextFunction } from 'express'
import { AuditLoggerService } from '../services/audit-logger.service'

// Endpoints that require audit logging
const SENSITIVE_ENDPOINTS = [
  '/api/users',
  '/api/profile',
  '/api/payments',
  '/api/orders',
  '/api/downloads',
  '/api/admin'
]

export async function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const path = req.path
  const method = req.method

  // Check if this is a sensitive endpoint
  const isSensitive = SENSITIVE_ENDPOINTS.some(endpoint => 
    path.startsWith(endpoint)
  )

  if (isSensitive && req.user) {
    try {
      await AuditLoggerService.logSensitiveApiAccess(
        req.user.id,
        req.user?.email || 'unknown',
        path,
        method,
        req
      )
    } catch (error) {
      // Never block request due to audit logging failure
      console.error('Audit middleware error:', error)
    }
  }

  next()
}
