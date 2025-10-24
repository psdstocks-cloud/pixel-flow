import { Request, Response, NextFunction } from 'express'
import { authRateLimiter, apiRateLimiter, publicRateLimiter } from '../lib/redis-rate-limit'

export type RateLimitType = 'auth' | 'api' | 'public'

export function redisRateLimit(type: RateLimitType = 'api') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use IP address as identifier
      const identifier = req.ip || req.socket.remoteAddress || 'anonymous'

      // Select appropriate rate limiter
      const limiter = 
        type === 'auth' ? authRateLimiter :
        type === 'public' ? publicRateLimiter :
        apiRateLimiter

      // Check rate limit
      const { success, limit, reset, remaining } = await limiter.limit(identifier)

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limit.toString())
      res.setHeader('X-RateLimit-Remaining', remaining.toString())
      res.setHeader('X-RateLimit-Reset', new Date(reset).toISOString())

      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000)
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: type === 'auth' 
            ? 'Too many authentication attempts. Please try again later.'
            : type === 'api'
            ? 'Too many requests. Please slow down.'
            : 'Rate limit exceeded. Please try again later.',
          retryAfter,
          limit,
          reset: new Date(reset).toISOString()
        })
      }

      next()
    } catch (error) {
      console.error('Rate limit error:', error)
      // Fail open - allow request if Redis is down (graceful degradation)
      next()
    }
  }
}
