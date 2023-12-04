import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'
import Domain from '@common/modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'

export function withValidation(handler: NextApiHandler) {
  return async function (request: NextApiRequest, response: NextApiResponse) {
    const { user } = await getCurrentUser(request, response)
    try {
      switch (user.roles[0]) {
        case 'GlobalAdmin':
          //для глобал адміна умови немає.
          break
        case 'DomainAdmin':
          const domainObject = await Domain.findOne({
            _id: request.query.id,
            adminEmails: user.email,
          })
          if (!domainObject) {
            throw new Error(
              'You do not have the rights to connect to this Domain.'
            )
          }
          break
        case 'User':
          const { domain } = await RealEstate.findOne({
            adminEmails: { $in: [user.email] },
          })
          if (!domain) {
            throw new Error('You do not have any Domain.')
          }

          if (domain.toString() !== request.query.id) {
            throw new Error(
              'You do not have the rights to connect to this Domain.'
            )
          }
          break
        default:
          //якщо ролі немає то поверне цю помилку
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
