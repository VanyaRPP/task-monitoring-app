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
      return jwt.verify(token as string, secret) as any
    },
  },
  providers: [
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
    // EmailProvider({
    //   server: {
    //     host: process.env.EMAIL_SERVER_HOST,
    //     port: process.env.EMAIL_SERVER_PORT,
    //     auth: {
    //       user: process.env.EMAIL_SERVER_USER,
    //       pass: process.env.EMAIL_SERVER_PASSWORD,
    //     },
    //   },
    //   from: process.env.EMAIL_FROM,
    //   async sendVerificationRequest({
    //     identifier: email,
    //     url,
    //     provider: { server, from },
    //   }) {
    //     const { host } = new URL(url)
    //     const transport = nodemailer.createTransport(server)
    //     await transport.sendMail({
    //       to: email,
    //       from,
    //       subject: `Login to ${host}`,
    //       text: text({ url, host }),
    //       html: html({ url, host, email }),
    //     })
    //   },
    // }),
    GoogleProvider({
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GithubProvider({
      allowDangerousEmailAccountLinking: true,
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    // FacebookProvider({
    //   clientId: process.env.FACEBOOK_CLIENT_ID,
    //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    // }),
    // ...add more providers here
  ],
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
    signIn: '/auth/signin',
    error: '/auth/signin', ///auth/error Error code passed in query string as ?error=
    // signOut: '/auth/signout',
    verifyRequest: '/auth/verify-request', // (used for check email message)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
  },
}

export default NextAuth(authOptions)
