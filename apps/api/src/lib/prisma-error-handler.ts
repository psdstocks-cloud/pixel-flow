/**
 * Prisma Error Handler
 * Converts Prisma errors to sanitized ApiErrors
 */

import { Prisma } from '@prisma/client'
import { ApiError, NotFoundError, ConflictError, ValidationError, DatabaseError } from './errors'

export function handlePrismaError(error: unknown): ApiError {
  // Prisma Client Known Request Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = (error.meta?.target as string[]) || []
        return new ConflictError(
          `A record with this ${target.join(', ')} already exists`,
          'DUPLICATE_RECORD'
        )

      case 'P2025':
        // Record not found
        return new NotFoundError('Record not found', 'RECORD_NOT_FOUND')

      case 'P2003':
        // Foreign key constraint violation
        return new ValidationError('Invalid reference to related record', 'INVALID_REFERENCE')

      case 'P2014':
        // Required relation violation
        return new ValidationError('Required relation missing', 'REQUIRED_RELATION')

      default:
        // Other Prisma errors - don't expose details
        return new DatabaseError('Database operation failed', error.code)
    }
  }

  // Prisma Client Validation Errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid data provided', 'VALIDATION_ERROR')
  }

  // Prisma Client Initialization Errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseError('Database connection failed', 'DB_CONNECTION_ERROR')
  }

  // Unknown errors
  return new DatabaseError('Database operation failed', 'UNKNOWN_DB_ERROR')
}
