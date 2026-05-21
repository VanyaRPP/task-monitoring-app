import clientPromise from '@common/lib/mongodb'
import { MongoDBAdapter } from '@next-auth/mongodb-adapter'
import jwt from 'jsonwebtoken'
import NextAuth, { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import User from '@modules/models/User'
import bcrypt from 'bcrypt'
import { saltRounds } from '@utils/constants'
import { isProd } from '@utils/env'

function html({ url, host, email }) {
  const escapedEmail = `${email.replace(/\./g, '&#8203;.')}`
  const escapedHost = `${host.replace(/\./g, '&#8203;.')}`
  return `
      <body>
        <h1>Your magic link</h1>
        <h3>You requested a login form ${escapedEmail}</h3>
        <p>
          <a href="${url}">Login to ${escapedHost}</a>
      </body>
  `
}

function text({ url, host }) {
  return `Login to ${host}\n${url}\n\n`
}

const googleId = process.env.GOOGLE_CLIENT_ID
const googleSecret = process.env.GOOGLE_CLIENT_SECRET
const githubId = process.env.GITHUB_ID
const githubSecret = process.env.GITHUB_SECRET

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Credentials',

    credentials: {
      name: { label: 'Name', type: 'text' },
      email: { label: 'Email', type: 'text' },
      password: { label: 'Password', type: 'password' },
      authType: { label: 'Auth Type', type: 'text' },
    },
    async authorize(credentials, req) {
      try {
        const user = await User.findOne({ email: credentials.email })

        if (credentials.authType === 'signIn') {
          if (
            user &&
            (await bcrypt.compare(credentials.password, user.password))
          ) {
            return {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
            }
          }
        } else {
          if (user) return null

          const hash = await bcrypt.hash(credentials.password, saltRounds)
          const newUser = await User.create({
            name: credentials.name,
            email: credentials.email,
            password: hash,
          })
          return {
            id: newUser._id.toString(),
            name: newUser.name,
            email: newUser.email,
          }
        }

        return null
      } catch (error) {
        return null
      }
    },
  }),
  ...(googleId && googleSecret
    ? [
        GoogleProvider({
          allowDangerousEmailAccountLinking: true,
          clientId: googleId,
          clientSecret: googleSecret,
        }),
      ]
    : []),
  ...(githubId && githubSecret && !isProd
    ? [
        GithubProvider({
          allowDangerousEmailAccountLinking: true,
          clientId: githubId,
          clientSecret: githubSecret,
        }),
      ]
    : []),
]

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  jwt: {
    encode: async ({ secret, token }) => {
      return jwt.sign(token as any, secret)
    },
    decode: async ({ secret, token }) => {
      return jwt.verify(token as string, secret, {
        algorithms: ['HS256'],
      }) as any
    },
  },
  providers,
  callbacks: {
    async signIn() {
      return true
    },
    async redirect({ url, baseUrl }) {
      return baseUrl
    },
    async session({ session, user, token }) {
      return session
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      return token
    },
  },
  pages: {
    verifyRequest: '/auth/verify-request',
  },
}

export default NextAuth(authOptions)
