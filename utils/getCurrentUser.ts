import type { NextApiRequest } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import User from '@common/modules/models/User'
import { Roles } from './constants'
import { isAdminCheck } from './helpers'

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
    }
    const isUser = user?.roles?.includes(Roles.USER) || user?.roles?.length === 0 || !user?.roles
    const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)
    const isDomainAdmin = user?.roles?.includes(Roles.DOMAIN_ADMIN)
    const isAdmin = isAdminCheck(user?.roles)
    return { isDomainAdmin, isGlobalAdmin, isUser, isAdmin, session, user }
  } else {
    throw new Error('bad request no permitions')
  }
}
