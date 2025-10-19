import { randomBytes } from 'crypto'

export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex')
}
