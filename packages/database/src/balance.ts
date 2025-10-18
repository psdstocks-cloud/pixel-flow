import { Prisma, UserBalance } from '@prisma/client'
import { prisma } from './index'

export class InsufficientBalanceError extends Error {
  constructor(readonly userId: string, readonly requiredPoints: number, readonly availablePoints: number) {
    super(`User ${userId} has ${availablePoints} points, but ${requiredPoints} are required.`)
    this.name = 'InsufficientBalanceError'
  }
}

export async function getOrCreateBalance(userId: string, tx = prisma): Promise<UserBalance> {
  return tx.userBalance.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })
}

export async function setBalancePoints(userId: string, points: number, tx = prisma): Promise<UserBalance> {
  return tx.userBalance.upsert({
    where: { userId },
    update: { points },
    create: { userId, points },
  })
}

export async function creditBalance(userId: string, points: number, tx = prisma): Promise<UserBalance> {
  if (points <= 0) return getOrCreateBalance(userId, tx)
  return tx.userBalance.upsert({
    where: { userId },
    update: { points: { increment: points } },
    create: { userId, points },
  })
}

export async function debitBalance(userId: string, points: number, tx = prisma): Promise<UserBalance> {
  if (points <= 0) {
    return getOrCreateBalance(userId, tx)
  }

  return tx.$transaction(async (trx) => {
    const balance = await trx.userBalance.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })

    if (balance.points < points) {
      throw new InsufficientBalanceError(userId, points, balance.points)
    }

    return trx.userBalance.update({
      where: { id: balance.id },
      data: { points: { decrement: points } },
    })
  })
}

export async function adjustBalance(userId: string, deltaPoints: number, tx = prisma): Promise<UserBalance> {
  if (deltaPoints === 0) return getOrCreateBalance(userId, tx)
  if (deltaPoints > 0) return creditBalance(userId, deltaPoints, tx)
  return debitBalance(userId, Math.abs(deltaPoints), tx)
}

export type BalanceTransactionCallback<T> = (trx: Prisma.TransactionClient) => Promise<T>

export async function withBalanceTransaction<T>(callback: BalanceTransactionCallback<T>): Promise<T> {
  return prisma.$transaction(async (trx) => callback(trx))
}
