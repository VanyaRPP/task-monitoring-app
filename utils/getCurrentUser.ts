import User from '@common/modules/models/User'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import { isAdminCheck } from '@utils/helpers'
import { getServerSession } from 'next-auth'
import { Roles } from './constants'

export async function getCurrentUser(req, res) {
  const session = await getServerSession(req, res, authOptions)
  const user = await User.findOne({ email: session?.user?.email })
  if (!user) {
    throw new Error('no user found')
  }
  const isUser =
    user?.roles?.includes(Roles.USER) ||
    user?.roles?.length === 0 ||
    !user?.roles
  const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = user?.roles?.includes(Roles.DOMAIN_ADMIN)
  const isAdmin = isAdminCheck(user?.roles)
  return { isDomainAdmin, isGlobalAdmin, isUser, isAdmin, session, user }
}
