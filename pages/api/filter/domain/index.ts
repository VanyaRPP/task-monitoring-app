/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import start from '@pages/api/api.config'
import { getDistinctCompanyAndDomain } from '@utils/helpers'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@modules/models/RealEstate'
import Domain from '@modules/models/Domain'
import { realEstates } from '@utils/testData'
import _intersectionBy from 'lodash/intersectionBy'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin, user } = await getCurrentUser(req, res)

  const { realEstateIds } = req.query

  if (req.method === 'GET') {
    try {
      const { distinctDomains } = await getDistinctCompanyAndDomain({
        isGlobalAdmin,
        user,
        companyGroup: 'company',
        model: RealEstate,
      })

      const domainsFilter = distinctDomains?.map(({ domainDetails }) => ({
        text: domainDetails.name,
        value: String(domainDetails._id),
      }))

      let result = domainsFilter

      if (realEstateIds) {
        const filteredRealEstates = await RealEstate.find({
          _id: { $in: realEstateIds?.split(',') },
        }).select('domain')

        const filteredDomains = await Domain.find({
          _id: { $in: filteredRealEstates.map((el) => el.domain) },
        })

        const filteredDomainsMapped = filteredDomains.map((el) => ({
          text: el.name,
          value: String(el._id),
        }))

        result = _intersectionBy(domainsFilter, filteredDomainsMapped, 'value')
        console.log('MyConsolelog', filteredDomainsMapped)
      }

      return res.status(200).json({ domainsFilter: result, success: true })
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message })
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }
}
