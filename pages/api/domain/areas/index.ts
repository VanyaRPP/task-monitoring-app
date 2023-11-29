// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@common/modules/models/RealEstate'
import Domain from '@common/modules/models/Domain'
import { getCurrentUser } from '@utils/getCurrentUser'
import start, { ExtendedData } from '@pages/api/api.config'
import { processInputData } from '@utils/helpers'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtendedData>
) {
  const { user } = await getCurrentUser(req, res)
  async function getDataMapping(role, email) {
    let domainId
    switch (role) {
      case 'GlobalAdmin':
      case 'DomainAdmin':
        const { _id } = await Domain.findOne({
          adminEmails: { $in: [email] },
        })
        domainId = _id
        break
      case 'User':
        const { domain } = await RealEstate.findOne({
          adminEmails: { $in: [email] },
        })
        domainId = domain
        break
      default:
        break
    }
    return getAreasData(domainId)
  }

  async function getAreasData(domainId: string) {
    const realEstates = await RealEstate.find({
      domain: { $in: [domainId] },
    }).select('totalArea companyName -_id')

    if (realEstates.length === 0) {
      throw new Error('There are no companies yet')
    }
    return processInputData(realEstates)
  }

  switch (req.method) {
    case 'GET':
      try {
        const result = await getDataMapping(user.roles[0], user.email)
        return res.status(200).json({ success: true, data: result })
      } catch (error) {
        console.log(error)
        return res.status(400).json({ success: false, message: error.message })
      }
  }
}
