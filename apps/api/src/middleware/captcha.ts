/**
 * Cloudflare Turnstile CAPTCHA Middleware
 * Validates CAPTCHA tokens for brute-force protection
 */

import { Request, Response, NextFunction } from 'express'
import { BadRequestError } from '../lib/errors'
import { logger } from '../lib/logger'

interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

export async function validateCaptcha(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const captchaToken = req.body.captchaToken || req.headers['x-captcha-token']

  if (!captchaToken) {
    throw new BadRequestError('CAPTCHA verification required', 'CAPTCHA_REQUIRED')
  }

  try {
    // Verify with Cloudflare Turnstile
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY!,
        response: captchaToken,
        remoteip: req.ip
      })
    })

    const data = await response.json() as TurnstileResponse

    if (!data.success) {
      logger.warn('CAPTCHA validation failed', {
        errors: data['error-codes'],
        ip: req.ip
      })
      throw new BadRequestError('CAPTCHA validation failed', 'CAPTCHA_INVALID')
    }

    logger.info('CAPTCHA validated successfully', { ip: req.ip })
    next()
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error
    }
    logger.error('CAPTCHA verification error', { error: error instanceof Error ? error.message : String(error) })
    throw new BadRequestError('CAPTCHA verification failed', 'CAPTCHA_ERROR')
  }
}

// Optional: Skip CAPTCHA in development
export function captchaMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_CAPTCHA === 'true') {
    logger.debug('CAPTCHA skipped in development')
    return next()
  }
  return validateCaptcha(req, res, next)
}
