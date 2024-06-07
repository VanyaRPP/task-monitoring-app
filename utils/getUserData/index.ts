import User from '@common/modules/models/User'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import { Roles } from '@utils/constants'
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'

export type UserData = {
  _id: string
  name: string
  email: string
  roles?: Roles[] | string[]
  image?: string
  isGlobalAdmin: boolean
  isDomainAdmin: boolean
}

/**
 * @returns information about current user (including `isGlobalAdmin`, `isDomainAdmin`)
 */
export async function getCurrentUserData(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<UserData | null> {
  const session = await getServerSession(req, res, authOptions)
  return await getUserData(session?.user?.email)
}

/**
 * @returns information about user by it's email (including `isGlobalAdmin`, `isDomainAdmin`)
 */
export async function getUserData(
  email: string | undefined
): Promise<UserData | null> {
  const user = await User.findOne({ email })

  if (!user) return null

  const isGlobalAdmin = user?.roles?.includes(Roles.GLOBAL_ADMIN)
  const isDomainAdmin = user?.roles?.includes(Roles.DOMAIN_ADMIN)

  return {
    _id: user._id.toString(),
    name: user.name,
    email,
    image: user.image,
    roles: user.roles,
    isGlobalAdmin,
    isDomainAdmin,
  }
}
