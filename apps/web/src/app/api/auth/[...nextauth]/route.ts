import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@pixel-flow/database'
import bcrypt from 'bcryptjs'
import { authOptions } from './authOptions'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
