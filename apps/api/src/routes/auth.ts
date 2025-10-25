import express from 'express'
import { asyncHandler } from '../lib/async-handler'
import { ValidationError } from '../lib/errors'
import { LoginAttemptService } from '../services/login-attempt.service'

const router = express.Router()

// ============================================
// CHECK LOCKOUT STATUS
// ============================================
router.post('/check-lockout', asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) {
    throw new ValidationError('Email is required')
  }

  const status = await LoginAttemptService.checkLockoutStatus(email)

  res.json({
    isLocked: status.isLocked,
    requiresCaptcha: status.requiresCaptcha,
    message: status.isLocked 
      ? 'Account temporarily locked due to too many failed attempts. Please try again later.'
      : undefined
  })
}))

// ============================================
// RECORD LOGIN ATTEMPT
// ============================================
router.post('/record-attempt', asyncHandler(async (req, res) => {
  const { email, success, failureReason, captchaToken } = req.body

  if (!email) {
    throw new ValidationError('Email is required')
  }

  // Get IP address from request
  const ipAddress = req.headers['x-forwarded-for'] as string || 
                   req.headers['x-real-ip'] as string || 
                   req.socket.remoteAddress || 
                   'unknown'

  // Get user agent
  const userAgent = req.headers['user-agent']

  await LoginAttemptService.recordAttempt({
    email,
    ipAddress,
    userAgent,
    success: success || false,
    failureReason: failureReason || undefined
  })

  res.json({ 
    success: true,
    message: 'Login attempt recorded'
  })
}))

export default router
