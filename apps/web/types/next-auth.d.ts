import NextAuth from 'next-auth'
import { DefaultSession } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user?: DefaultSession['user'] & {
      id: string
      nextPaymentDue?: string | null
    }
  }

  interface User {
    id: string
    nextPaymentDue?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    nextPaymentDue?: string | null
  }
}