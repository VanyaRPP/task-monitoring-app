import { DefaultSession } from 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      roles: string[]
    } & DefaultSession['user']
  }

  interface User {
    roles: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    roles?: string[]
  }
}