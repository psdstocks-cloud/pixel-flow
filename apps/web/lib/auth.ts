import bcrypt from 'bcryptjs'
import { prisma } from '@pixel-flow/database'

export type CreateUserInput = {
  email: string
  password: string
  name?: string | null
}

const HASH_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  const normalized = password.trim()
  if (!normalized) throw new Error('Password is required')
  return bcrypt.hash(normalized, HASH_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false
  return bcrypt.compare(password, hash)
}

export async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null
  return prisma.user.findUnique({ where: { email: normalized } })
}

export async function createUser(input: CreateUserInput) {
  const normalizedEmail = input.email.trim().toLowerCase()
  const hashedPassword = await hashPassword(input.password)
  return prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      name: input.name?.trim() || null,
    },
  })
}