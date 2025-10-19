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

export async function createVerificationToken(userId: string) {
  const token = await import('./token').then(m => m.generateVerificationToken())
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  return prisma.verificationToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })
}

export async function verifyUser(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!verificationToken) {
    throw new Error('Invalid verification token')
  }

  if (verificationToken.expiresAt < new Date()) {
    throw new Error('Verification token has expired')
  }

  // Mark user as verified
  await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { verified: true },
  })

  // Delete the token
  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  })

  return verificationToken.user
}