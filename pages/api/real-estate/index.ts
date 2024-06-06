// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import RealEstate from '@common/modules/models/RealEstate'
import { getCurrentUser } from '@utils/getCurrentUser'
import start, { ExtendedData } from '@pages/api/api.config'
import Domain from '@common/modules/models/Domain'
import {
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
          companyId,
          domainId,
          streetId,
          limit = 0,
        } = req.query

        if (companyId) options._id = { $in: companyId }

        if (streetId) options.street = { $in: streetId }

        if (isUser) options.adminEmails = { $in: [user.email] }

        if (isDomainAdmin) {
          const domains = await (Domain as any).find({
            adminEmails: { $in: [user.email] },
          })

          const domainIds = domains.map((i) => i._id.toString())

          if (domainId) {
            options.domain = {
              $in: domainId.filter((id) => domainIds.includes(id)),
            }
          } else if (domainIds) {
            options.domain = { $in: domainIds }
          }
        }

        // if (companyId) options._id = { $in: companyId }

        // if (streetId) options.street = { $in: streetId }

        // if (isUser) options.$or = [{ adminEmails: user.email }]

        // if (isDomainAdmin) {
        //   const domains = await (Domain as any).find({
        //     adminEmails: user.email,
        //   })

        //   const domainIds = domains.map((i) => i._id.toString())

        //   if (domainId) {
        //     options.$or.push({
        //       $in: domainId.filter((id) => domainIds.includes(id)),
        //     })
        //   } else if (domainIds) {
        //     options.domain = { $in: domainIds }
        //   }
        // }

        const realEstates = await RealEstate.find(options)
          .limit(+limit)
          .populate({
            path: 'domain',
            select: '_id name description',
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
