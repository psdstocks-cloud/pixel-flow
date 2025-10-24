/**
 * Custom API Error Classes
 * Provides type-safe, sanitized error handling for production
 */

export class ApiError extends Error {
  statusCode: number
  isOperational: boolean
  code?: string

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.code = code
    Error.captureStackTrace(this, this.constructor)
  }
}

// 400-level errors (Client errors)
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', code?: string) {
    super(message, 400, true, code)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', code?: string) {
    super(message, 401, true, code)
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', code?: string) {
    super(message, 403, true, code)
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', code?: string) {
    super(message, 404, true, code)
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict', code?: string) {
    super(message, 409, true, code)
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', code?: string) {
    super(message, 422, true, code)
  }
}

// 500-level errors (Server errors)
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', code?: string) {
    super(message, 500, false, code)
  }
}

// Database errors
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database operation failed', code?: string) {
    super(message, 500, false, code)
  }
}
