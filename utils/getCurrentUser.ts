import User from '@modules/models/User'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import { isAdminCheck } from '@utils/helpers'
import { getServerSession } from 'next-auth'
import { Roles } from './constants'
import Domain from '@modules/models/Domain'

export async function getCurrentUser(req, res) {
  const session = await getServerSession(req, res, authOptions)
  const user = await User.findOne({ email: session?.user?.email })
  if (!user) {
    throw new Error('no user found')
  }
  // Role is derived from ownership: a user is a DomainAdmin if (and only if)
  // their email is listed in the adminEmails of at least one Domain. Being an
  // admin of a company (RealEstate) makes them a company owner, but the role
  // stays User. GlobalAdmin is never touched by this derivation.
  if (!user.roles?.includes(Roles.GLOBAL_ADMIN)) {
    const shouldBeDomainAdmin = Boolean(
      await Domain.exists({ adminEmails: user.email })
    )
    const hasDomainAdmin = user.roles?.includes(Roles.DOMAIN_ADMIN)
    const hasUserRole = user.roles?.includes(Roles.USER)

    if (shouldBeDomainAdmin && (!hasDomainAdmin || hasUserRole)) {
      // Promote: a domain admin is no longer a plain User, so REPLACE the role
      await User.updateOne({ _id: user._id }, { roles: [Roles.DOMAIN_ADMIN] })
      user.roles = [Roles.DOMAIN_ADMIN]
    } else if (!shouldBeDomainAdmin && hasDomainAdmin) {
      // Demote: the user no longer administers any domain, so reset to User.
      await User.updateOne({ _id: user._id }, { roles: [Roles.USER] })
      user.roles = [Roles.USER]
    }
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
