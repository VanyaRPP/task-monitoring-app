import Domain from '@common/modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'

export function withValidation(handler: NextApiHandler) {
  return async function (request: NextApiRequest, response: NextApiResponse) {
    const { user } = await getCurrentUser(request, response)
    try {
      switch (user.roles[0]) {
        case 'GlobalAdmin':
          break
        case 'DomainAdmin':
          const domainObject = await Domain.findOne({
            _id: request.query.id,
            adminEmails: user.email,
          })
          if (!domainObject) {
            throw new Error('You do not have access to use this domain')
          }
          break
        case 'User':
          const estateObject = await RealEstate.findOne({
            adminEmails: { $in: [user.email] },
          })
          if (!estateObject) {
            throw new Error('You do not have a real estate object')
          }
          if (estateObject.domain.toString() !== request.query.id) {
            throw new Error('You do not have access to use this domain')
          }
          break
        default:
          throw new Error('You are not autorized')
      }
      return handler(request, response)
    } catch (error) {
      return response
        .status(400)
        .json({ success: false, message: error.message })
    }
  }
}
