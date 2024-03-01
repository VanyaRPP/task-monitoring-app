// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import Domain from '@common/modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'
import start, { ExtendedData } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  filterOptions,
  getDistinctCompanyAndDomain,
  getDistinctStreets,
} from '@utils/helpers'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtendedData>
) {
  const { isGlobalAdmin, isDomainAdmin, isAdmin, isUser, user } =
    await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET':
      try {
        const options = {}
        const {
          companyIds,
          domainIds,
          domainId,
          streetId,
          companyId,
          limit = 0,
        } = req.query

        if (domainId) options.domain = domainId
        if (companyId) options._id = companyId

        if (domainIds) {
          options.domain = filterOptions(options?.domain, domainIds)
        }

        if (companyIds) {
          options._id = filterOptions(options?._id, companyIds)
        }
        if (streetId) {
          options.street = filterOptions(options?.street, streetId)
        }

        if (isDomainAdmin) {
          const domains = await Domain.find({
            adminEmails: { $in: [user.email] },
          })
          const domainsIds = domains.map((i) => i._id.toString())
          if (domainId) {
            // TODO: add test. Domain admin can't fetch realEstate which is not belong to him
            if (!domainsIds.includes(domainId)) {
              return res.status(400).json({
                success: false,
                message: 'not allowed to fetch such domainId',
              })
            }
          } else {
            options.domain = { $in: domainsIds }
          }
        }

        if (isUser) {
          options.adminEmails = { $in: [user.email] }
        }

        const realEstates = await RealEstate.find(options)
          .limit(+limit)
          .populate({
            path: 'domain',
            select: '_id name description, adminEmails',
          })
          .populate({ path: 'street', select: '_id address city' })

        const { distinctDomains, distinctCompanies } =
          await getDistinctCompanyAndDomain({
            isGlobalAdmin,
            user,
            companyGroup: '_id',
            model: RealEstate,
          })

        const distinctStreets = await getDistinctStreets({
          user,
          model: RealEstate,
        })

        const filteredStreets = distinctStreets
          // parse to regular IStreet
          ?.map((street) => street.streetData as IStreet)
          // remove dublicates
          .filter(
            (street, index, streets) =>
              index ===
              streets.findIndex(
                (s) => s._id.toString() === street._id.toString()
              )
          )

        return res.status(200).json({
          domainsFilter: distinctDomains?.map(({ domainDetails }) => ({
            text: domainDetails.name,
            value: domainDetails._id,
          })),
          realEstatesFilter: distinctCompanies?.map(({ companyDetails }) => ({
            text: companyDetails.companyName,
            value: companyDetails._id,
          })),
          streetsFilter: filteredStreets?.map((street) => ({
            text: `${street.address}, м.${street.city}`,
            value: street._id,
          })),
          data: realEstates,
          success: true,
        })
      } catch (error) {
        return res.status(400).json({ success: false, message: error })
      }

    case 'POST':
      try {
        if (!isAdmin) {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }
        // TODO: body validation
        const realEstate = await RealEstate.create(req.body)
        return res.status(200).json({ success: true, data: realEstate })
      } catch (error) {
        return res.status(400).json({ success: false, message: error })
      }
  }
}
