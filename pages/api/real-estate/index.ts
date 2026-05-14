import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import { IStreet } from '@modules/models/Street'
import start, { ExtendedData } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { getDistinctCompanyAndDomain, getDistinctStreets } from '@utils/helpers'
import { isValidEmail } from '@common/assets/features/validators'
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
        const { companyId, domainId, streetId, archived, services, limit = 0 } = req.query

        const servicesIds: string[] | null = services
          ? typeof services === 'string'
            ? services.split(',').map((id) => decodeURIComponent(id))
            : (services as string[]).map((id) => decodeURIComponent(id))
          : null
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

        const isArchived = archived ? archived === 'true' : undefined

        /**
         * request data filters
         */
        const filters: FilterQuery<typeof RealEstate> = {
          archived: isArchived !== undefined ? isArchived : false,
          ...(!!companiesIds?.length && { _id: { $in: companiesIds } }),
          ...(!!domainsIds?.length && { domain: { $in: domainsIds } }),
          ...(!!streetsIds?.length && { street: { $in: streetsIds } }),
        }

        if (servicesIds && servicesIds.length > 0) {
          filters.$or = servicesIds.map((serviceKey) => {
            if (['cleaning', 'totalArea', 'pricePerMeter', 'waterPart'].includes(serviceKey)) {
              return { [serviceKey]: { $gt: 0 } }
            }
            if (['garbageCollector', 'inflicion'].includes(serviceKey)) {
              return { [serviceKey]: true }
            }
            return {
              $or: [
                { services: { $elemMatch: { $or: [{ _id: serviceKey }, { serviceId: serviceKey }, { service: serviceKey }] } } },
                { customServices: { $elemMatch: { $or: [{ _id: serviceKey }, { serviceId: serviceKey }, { service: serviceKey }] } } }
              ]
            }
          })
        }

        /**
         * access restrictions
         */
        const options: FilterQuery<typeof RealEstate> = {}

        if (isGlobalAdmin) {
        } else if (isDomainAdmin) {
          // Filter domains by admin email
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
            filters: {},
          })

        const distinctStreets = await getDistinctStreets({
          user,
          model: RealEstate,
          filters: {},
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
          data: realEstates,
          success: true,
        })
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return res.status(400).json({ success: false, message: error })
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

        const incomingEmails = req.body?.adminEmails
        if (incomingEmails !== undefined) {
          if (!Array.isArray(incomingEmails) || !isValidEmail(incomingEmails)) {
            return res
              .status(400)
              .json({ success: false, message: 'Invalid email address in adminEmails' })
          }
        }

        if (isDomainAdmin && !isGlobalAdmin) {
          const { domain } = req.body
          if (!domain) {
            return res
              .status(400)
              .json({ success: false, message: 'Domain is required' })
          }

          const adminDomain = await Domain.findOne({
            _id: domain,
            adminEmails: user.email,
          })

          if (!adminDomain) {
            return res
              .status(403)
              .json({
                success: false,
                message: 'Access denied: domain not found or you are not an admin of this domain',
              })
          }

          if (!req.body.adminEmails || !Array.isArray(req.body.adminEmails)) {
            req.body.adminEmails = []
          }
          if (!req.body.adminEmails.includes(user.email)) {
            req.body.adminEmails.push(user.email)
          }
        }

        const realEstate = await RealEstate.create(req.body)
        return res.status(200).json({ success: true, data: realEstate })
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return res.status(400).json({ success: false, message: error })
      }
  }
}
