import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client using REST API (works in serverless/Railway)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Auth rate limiter - STRICT (5 requests per 15 minutes)
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
})

// API rate limiter - MODERATE (100 requests per 15 minutes)
export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '15 m'),
  analytics: true,
  prefix: 'ratelimit:api',
})

// Public rate limiter - GENEROUS (1000 requests per 15 minutes)
export const publicRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '15 m'),
  analytics: true,
  prefix: 'ratelimit:public',
})

// Export redis client for health checks
export { redis }
