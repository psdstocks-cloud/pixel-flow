import Redis from 'ioredis'
import { config } from './index'

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
})

redis.on('connect', () => {
  console.log('✅ Redis connected')
})

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err)
})

export { redis }
