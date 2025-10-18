import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

export * from './balance'

export default prisma
