/**
 * Structured Logger for Error Tracking
 * Logs errors securely without exposing sensitive data
 */

interface LogContext {
  error?: string
  stack?: string
  url?: string
  method?: string
  ip?: string
  userId?: string
  statusCode?: number
  [key: string]: any
}

class Logger {
  private sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) return data

    const sanitized: any = Array.isArray(data) ? [] : {}
    const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie']

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()
      
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const sanitizedContext = context ? this.sanitize(context) : {}
    
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...sanitizedContext
    })
  }

  error(message: string, context?: LogContext) {
    console.error(this.formatMessage('ERROR', message, context))
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('WARN', message, context))
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage('INFO', message, context))
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, context))
    }
  }
}

export const logger = new Logger()
