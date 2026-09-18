import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import User, { IUser } from '@modules/models/User'
import type { Types } from 'mongoose'

import { Roles } from '../constants'
import { PaymentOptions } from '../types'

/**
 * Helpers that query the database, moved out of `utils/helpers` untouched.
 *
 * That file is imported by ~84 client components, so anything importing a
 * model there drags mongoose into the client bundle. Until mongoose 8 that was
 * harmless: the package shipped a browser build whose `model()` returned a
 * plain document class, and webpack picked it through the `browser` field.
 * mongoose 9 dropped that build, so the full driver — client-side encryption,
 * the AWS SDK, tls/net/child_process — is what follows the models into the
 * browser now, and webpack cannot resolve any of it.
 */

export const getPaymentOptions = async ({
  searchEmail,
  userEmail,
}: PaymentOptions) => {
  const options: { payer?: string | Types.ObjectId } = {}
  // searching for original user
  const user = await User.findOne({ email: userEmail })

  const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)

  if (isGlobalAdmin) {
    if (searchEmail) {
      // 1. admin looking for someone items
      const searchUser = await User.findOne({ email: searchEmail })
      // TODO: what if user not exists? if (!searchUser) {}

      options.payer = searchUser._id
      return options
    }

    // 2. admin looking for all items
    return options
  }

  // 3. user can see only his items
  options.payer = user._id

  return options
}

// DOMAIN ADMIN HELPER
export async function isDomainAdmin(user?: IUser): Promise<boolean> {
  if (!user || !user.email) {
    return false
  }

  try {
    const domain = await RealEstate.findOne({ adminEmails: user.email })
    return !!domain
  } catch (error) {
    console.error(error)
    return false
  }
}

export async function getDomainAdminDomains(
  userEmail: string
): Promise<string[]> {
  try {
    const domains = await Domain.find({
      adminEmails: userEmail,
    })
    return domains.map((domain) => domain._id.toString())
  } catch (error) {
    console.error(error)
    return []
  }
}
