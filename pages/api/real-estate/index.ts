import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import Street, { IStreet } from '@modules/models/Street'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { FilterQuery } from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { isGlobalAdmin, isDomainAdmin, isAdmin, isUser, user } =
    await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET':
      try {
        const { companyId, domainId, streetId, limit = 0 } = req.query

        const companiesIds: string[] | null = companyId
          ? typeof companyId === 'string'
            ? companyId.split(',').map((id) => decodeURIComponent(id))
            : companyId.map((id) => decodeURIComponent(id))
          : null
        const domainsIds: string[] | null = domainId
          ? typeof domainId === 'string'
            ? domainId.split(',').map((id) => decodeURIComponent(id))
            : domainId.map((id) => decodeURIComponent(id))
          : null
        const streetsIds: string[] | null = streetId
          ? typeof streetId === 'string'
            ? streetId.split(',').map((id) => decodeURIComponent(id))
            : streetId.map((id) => decodeURIComponent(id))
          : null

        /**
         * request data filters
         */
        const filters: FilterQuery<typeof RealEstate> = {
          ...(!!companiesIds?.length && { _id: { $in: companiesIds } }),
          ...(!!domainsIds?.length && { domain: { $in: domainsIds } }),
          ...(!!streetsIds?.length && { street: { $in: streetsIds } }),
        }

        /**
         * access restrictions
         */
        const options: FilterQuery<typeof RealEstate> = {}

        if (isGlobalAdmin) {
        } else if (isDomainAdmin) {
          const domains = await Domain.distinct('_id', {
            adminEmails: user.email,
          })

          options.$or = [
            { domain: { $in: domains.map((id) => id.toString()) } },
            { adminEmails: user.email },
          ]
        } else if (isUser) {
          options.adminEmails = user.email
        }

        const realEstates = await RealEstate.find({ $and: [options, filters] })
          .limit(+limit)
          .populate('domain')
          .populate('street')

        const distinctStreets = await RealEstate.distinct('street', options)

        const [relatedDomains, relatedCompanies, relatedStreets] =
          await Promise.all([
            Domain.find({
              $or: [
                { streets: { $in: distinctStreets } },
                { adminEmails: user.email },
              ],
            }).select(['name', '_id']),
            RealEstate.find(options).select(['companyName', '_id']),
            Street.find({ _id: { $in: distinctStreets } }).select([
              'address',
              'city',
              '_id',
            ]),
          ])

        return res.status(200).json({
          domainsFilter: relatedDomains?.map((domain) => ({
            text: domain.name,
            value: domain._id.toString(),
          })),
          realEstatesFilter: relatedCompanies?.map((company) => ({
            text: company.companyName,
            value: company._id.toString(),
          })),
          streetsFilter: relatedStreets?.map((street) => ({
            text: `${street.address} (м.${street.city})`,
            value: street._id.toString(),
          })),
          data: realEstates,
          success: true,
        })
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return res.status(500).json({ success: false, message: error })
      }

    case 'POST':
      try {
        if (!isAdmin) {
          return (
            res
              .status(400)
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              .json({ success: false, message: 'not allowed' })
          )
        }
        // TODO: body validation
        const realEstate = await RealEstate.create(req.body)
        return res.status(200).json({ success: true, data: realEstate })
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return res.status(400).json({ success: false, message: error })
      }
  }
}
