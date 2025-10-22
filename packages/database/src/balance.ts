import { Prisma, PrismaClient, User } from '@prisma/client'
import { prisma } from './index'

export class InsufficientBalanceError extends Error {
  constructor(readonly userId: string, readonly requiredPoints: number, readonly availablePoints: number) {
    super(`User ${userId} has ${availablePoints} points, but ${requiredPoints} are required.`)
    this.name = 'InsufficientBalanceError'
  }
}

type PrismaTransaction = Prisma.TransactionClient

const getClient = (tx?: PrismaTransaction): PrismaClient | PrismaTransaction => tx ?? prisma

export async function getUserBalance(userId: string, tx?: PrismaTransaction): Promise<number> {
  const client = getClient(tx)
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  })

  if (!user) {
    throw new Error(`User ${userId} not found`)
  }

  return user.balance
}

export async function setBalancePoints(userId: string, points: number, tx?: PrismaTransaction): Promise<User> {
  if (points < 0) {
    throw new Error('Balance cannot be negative')
  }

  const client = getClient(tx)

  return client.user.update({
    where: { id: userId },
    data: { balance: points },
  })
}

export async function creditBalance(userId: string, points: number, tx?: PrismaTransaction): Promise<User> {
  const client = getClient(tx)

  if (points <= 0) {
    return client.user.findUniqueOrThrow({ where: { id: userId } })
  }

  return client.user.update({
    where: { id: userId },
    data: { balance: { increment: points } },
  })
}

export async function debitBalance(userId: string, points: number, tx?: PrismaTransaction): Promise<User> {
  if (points <= 0) {
    const client = getClient(tx)
    return client.user.findUniqueOrThrow({ where: { id: userId } })
  }

  if (tx) {
    return performDebit(userId, points, tx)
  }

  return prisma.$transaction((trx) => performDebit(userId, points, trx))
}

export async function adjustBalance(userId: string, deltaPoints: number, tx?: PrismaTransaction): Promise<User> {
  const client = getClient(tx)

  if (deltaPoints === 0) return client.user.findUniqueOrThrow({ where: { id: userId } })
  if (deltaPoints > 0) return creditBalance(userId, deltaPoints, tx)
  return debitBalance(userId, Math.abs(deltaPoints), tx)
}

export type BalanceTransactionCallback<T> = (trx: Prisma.TransactionClient) => Promise<T>

export async function withBalanceTransaction<T>(callback: BalanceTransactionCallback<T>): Promise<T> {
  return prisma.$transaction(async (trx) => callback(trx))
}

async function performDebit(userId: string, points: number, tx: Prisma.TransactionClient): Promise<User> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  })

  if (!user) {
    throw new Error(`User ${userId} not found`)
  }

  if (user.balance < points) {
    throw new InsufficientBalanceError(userId, points, user.balance)
  }

  return tx.user.update({
    where: { id: userId },
    data: { balance: { decrement: points } },
  })
}
