import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import { IStreet } from '@modules/models/Street'
import start, { ExtendedData } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { getDistinctCompanyAndDomain, getDistinctStreets } from '@utils/helpers'
import { FilterQuery } from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

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
        const { companyId, domainId, streetId, archive, limit = 0 } = req.query

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
          archived: { $ne: archive },
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
        if (
          (domainsIds && domainsIds.length > 0) ||
          (streetsIds && streetsIds.length > 0)
        ) {
          const filteredRealEstates = await RealEstate.find({
            $and: [filters, { archived: { $ne: true } }],
          })

          return res.status(200).json({
            success: true,
            data: filteredRealEstates,
          })
        }
        return res.status(200).json({
          domainsFilter: distinctDomains?.map(({ domainDetails }) => ({
            text: domainDetails.name,
            value: domainDetails._id,
          })),
          realEstatesFilter: distinctCompanies?.map(({ companyDetails }) => ({
            text: companyDetails.companyName,
            value: companyDetails._id,
          })),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          streetsFilter: filteredStreets?.map((street) => ({
            text: `${street.address}, м.${street.city}`,
            value: street._id,
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
