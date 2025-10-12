import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import Redis from 'ioredis'
import { config } from '../config'

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
})

// General rate limiting
export const rateLimitMiddleware = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:general:',
  }),
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Authentication rate limiting
export const authRateLimit = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
})

// Stock download rate limiting
export const stockDownloadRateLimit = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:stock:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 stock downloads per hour
  message: 'Too many stock download requests, please try again later.',
})

// AI generation rate limiting
export const aiGenerationRateLimit = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:ai:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 AI generations per hour
  message: 'Too many AI generation requests, please try again later.',
})
