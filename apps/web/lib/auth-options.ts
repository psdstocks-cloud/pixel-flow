import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { z } from 'zod'
import { findUserByEmail, verifyPassword } from './auth'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt' as const,
    maxAge: 60 * 60 * 24 * 30,
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials)
        if (!parsed.success) {
          throw new Error('Invalid credentials')
        }

        const { email, password } = parsed.data
        const user = await findUserByEmail(email)
        if (!user || !user.password) {
          return null
        }

        const passwordValid = await verifyPassword(password, user.password)
        if (!passwordValid) {
          return null
        }

        if (!user.verified) {
          throw new Error('Please verify your email before signing in.')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          nextPaymentDue: null,
          verified: user.verified,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.nextPaymentDue = user.nextPaymentDue ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === 'string' ? token.id : ''
        session.user.email = token.email as string | undefined
        session.user.name = token.name as string | undefined
        session.user.nextPaymentDue = (token.nextPaymentDue as string | null) ?? null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
