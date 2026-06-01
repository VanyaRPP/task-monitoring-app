import User from '@modules/models/User'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import { isAdminCheck } from '@utils/helpers'
import { getServerSession } from 'next-auth'
import { Roles } from './constants'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'

export async function getCurrentUser(req, res) {
  const session = await getServerSession(req, res, authOptions)
  const user = await User.findOne({ email: session?.user?.email })
  if (!user) {
    throw new Error('no user found')
  }
  const isInDomain = await Domain.exists({ adminEmails: user.email })
  const isInRealEstate = await RealEstate.exists({ adminEmails: user.email })
  const shouldBeDomainAdmin = Boolean(isInDomain || isInRealEstate)
 
  if (
    shouldBeDomainAdmin &&
    !user.roles?.includes(Roles.DOMAIN_ADMIN) &&
    !user.roles?.includes(Roles.GLOBAL_ADMIN)
  ) {
    
    await User.updateOne(
      { _id: user._id },
      { $addToSet: { roles: Roles.DOMAIN_ADMIN } }
    )
    user.roles = [...(user.roles || []), Roles.DOMAIN_ADMIN]
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
