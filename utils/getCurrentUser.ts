import type { NextApiRequest } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import User from '@common/modules/models/User'
import { Roles } from './constants'

function isNextApiRequest(obj: any): obj is NextApiRequest {
  return (
    obj?.url !== undefined &&
    obj?.method !== undefined &&
    obj?.headers !== undefined
  )
}

export async function getCurrentUser(req, res) {
  if (isNextApiRequest(req)) {
    const session = await getServerSession(req, res, authOptions)
    const user = await User.findOne({ email: session?.user?.email })
    if (!user) {
      throw new Error('no user found')
      return
    }
    const isAdmin = user?.role === Roles.ADMIN
    return { session, user, isAdmin }
  } else {
    throw new Error('bad request no permitions')
  }
}
