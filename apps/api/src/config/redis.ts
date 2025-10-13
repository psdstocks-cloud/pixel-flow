import Redis from 'ioredis'
import { config } from './index'

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  lazyConnect: true,
})

redis.on('connect', () => {
  console.log('✅ Redis connected')
})

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err)
  // Don't throw error, just log it
})

// Graceful connection handling
redis.on('ready', () => {
  console.log('✅ Redis ready')
})

redis.on('close', () => {
  console.log('⚠️ Redis connection closed')
})

export { redis }
