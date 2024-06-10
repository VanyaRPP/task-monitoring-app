import Domain from '@common/modules/models/Domain'
import Payment from '@common/modules/models/Payment'
import RealEstate from '@common/modules/models/RealEstate'
import Service from '@common/modules/models/Service'
import Street from '@common/modules/models/Street'
import start from '@pages/api/api.config'
import { getMongoCount } from '@utils/getMongoCount'
import { getRelatedDomains } from '@utils/getRelated'
import { getCurrentUserData } from '@utils/getUserData'
import { NumberToFormattedMonth } from '@utils/helpers'
import { toFilters } from '@utils/toFilters'
import { toQuery } from '@utils/toQuery'
import { FilterQuery } from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await getCurrentUserData(req, res)

  if (!user) {
    return res.status(401).json({ error: 'unauthorized user' })
  }

  if (req.method === 'GET') {
    try {
      const {
        paymentId: _paymentId,
        domainId: _domainId,
        streetId: _streetId,
        companyId: _companyId,
        serviceId: _serviceId,
        type: _type,
        year,
        month,
        limit = 0,
        skip = 0,
      } = req.query

      const paymentId = toQuery(_paymentId)
      const domainId = toQuery(_domainId)
      const streetId = toQuery(_streetId)
      const companyId = toQuery(_companyId)
      const serviceId = toQuery(_serviceId)
      const type = toQuery(_type)

      // TODO: fix this function to actually make filter by period possible
      // const period = toPeriodFiltersQuery<typeof Payment>('invocieCreationDate', {
      //   year: toQuery(year),
      //   month: toQuery(month),
      // })

      const options: FilterQuery<typeof Payment> = {}
      const filters: FilterQuery<typeof Payment> = {}

      // TODO: related payments
      // options._id = { $in: await getRelatedPayments(req, res, user) }
      options.domain = { $in: await getRelatedDomains(req, res, user) }
      // TODO: fix test data to properly distribute streets security
      // options.street = { $in: await getRelatedStreets(req, res, user) }
      // TODO: related companies
      // options.company = { $in: await getRelatedCompanies(req, res, user) }
      // options.monthService = { $in: await getRelatedServices(req, res, user) }

      if (paymentId) {
        filters._id = { $in: paymentId }
      }
      if (domainId) {
        filters.domain = { $in: domainId }
      }
      if (streetId) {
        filters.street = { $in: streetId }
      }
      if (companyId) {
        filters.company = { $in: companyId }
      }
      if (serviceId) {
        filters.monthService = { $in: serviceId }
      }
      if (type) {
        filters.type = { $in: type }
      }
      // if (period) {
      //   filters.$expr = { $and: period }
      // }

      const payments = await Payment.find({ $and: [options, filters] })
        .skip(+skip)
        .limit(+limit)
        .populate('street')
        .populate('domain')
        .populate('company')
        .populate('monthService')

      const filter = {
        type: toFilters(await Payment.distinct('type', options)),
        domain: toFilters(
          await Domain.find({
            _id: { $in: await Payment.distinct('domain', options) },
          }),
          '_id',
          'name'
        ),
        street: toFilters(
          await Street.find({
            _id: { $in: await Payment.distinct('street', options) },
          }),
          '_id',
          (street) => `вул. ${street.address} (м. ${street.city})`
        ),
        company: toFilters(
          await RealEstate.find({
            _id: { $in: await Payment.distinct('company', options) },
          }),
          '_id',
          'companyName'
        ),
        monthService: toFilters(
          await Service.find({
            _id: { $in: await Payment.distinct('monthService', options) },
          }),
          '_id'
        ),
        month: toFilters(
          await Payment.distinct('invoiceCreationDate', options),
          (date) => new Date(date).getMonth() + 1,
          (date) => NumberToFormattedMonth(new Date(date).getMonth() + 1)
        ),
        year: toFilters(
          await Payment.distinct('invoiceCreationDate', options),
          (date) => new Date(date).getFullYear()
        ),
      }

      const total = await getMongoCount(Payment, {
        $and: [options, filters],
      })

      return res.status(200).json({ data: payments, filter, total })
    } catch (error) {
      return res.status(500).json({ error })
    }
  } else if (req.method === 'POST') {
    try {
      const payment = await Payment.create(req.body)

      return res.status(201).json(payment)
    } catch (error) {
      return res.status(500).json({ error: error })
    }
  }
}

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse<ExtendedData>
// ) {
//   const { isUser, isDomainAdmin, isGlobalAdmin, isAdmin, user } =
//     await getCurrentUser(req, res)

//   if (req.method === 'GET') {
//     try {
//       const { streetIds, companyIds, domainIds, limit, skip, type } = req.query

//       const companiesIds: string[] | null = companyIds
//         ? typeof companyIds === 'string'
//           ? companyIds.split(',').map((id) => decodeURIComponent(id))
//           : companyIds.map((id) => decodeURIComponent(id))
//         : null
//       const streetsIds: string[] | null = streetIds
//         ? typeof streetIds === 'string'
//           ? streetIds.split(',').map((id) => decodeURIComponent(id))
//           : streetIds.map((id) => decodeURIComponent(id))
//         : null
//       const domainsIds: string[] | null = domainIds
//         ? typeof domainIds === 'string'
//           ? domainIds.split(',').map((id) => decodeURIComponent(id))
//           : domainIds.map((id) => decodeURIComponent(id))
//         : null

//       const options: FilterQuery<typeof Payment> = {}

//       if (isGlobalAdmin) {
//         if (companiesIds) {
//           options.company = { $in: companiesIds }
//         }
//         if (streetsIds) {
//           options.street = { $in: streetIds }
//         }
//         if (domainsIds) {
//           options.domain = { $in: domainsIds }
//         }
//       } else if (isDomainAdmin) {
//         const relatedDomainsIds = (
//           await Domain.find({
//             adminEmails: user.email,
//           })
//         ).map((domain) => domain._id.toString())

//         const companies = await RealEstate.find({
//           ...(companiesIds ? { _id: { $in: companiesIds } } : {}),
//           $or: [
//             { adminEmails: user.email },
//             { domain: { $in: relatedDomainsIds } },
//           ],
//         })

//         options.company = {
//           $in: companies.map(({ _id }) => _id.toString()),
//         }

//         if (streetsIds) {
//           options.street = { $in: streetIds }
//         }

//         const domains = await Domain.find({
//           ...(domainsIds ? { _id: { $in: domainsIds } } : {}),
//           adminEmails: user.email,
//         })

//         options.domain = {
//           $in: domains.map(({ _id }) => _id.toString()),
//         }
//       } else if (isUser) {
//         const companies = await RealEstate.find({
//           ...(companiesIds ? { _id: { $in: companiesIds } } : {}),
//           adminEmails: user.email,
//           ...(domainIds ? { domain: { $in: domainIds } } : {}),
//         })

//         options.company = {
//           $in: companies.map(({ _id }) => _id.toString()),
//         }
//         options.domain = {
//           $in: companies.map(({ domain }) => domain.toString()),
//         }

//         if (streetsIds) {
//           options.street = { $in: streetIds }
//         }
//       }

//       if (type) {
//         options.type = type
//       }

//       const expr = filterPeriodOptions(req.query)
//       if (expr.length > 0) {
//         options.$expr = {
//           $and: expr,
//         }
//       }

//       const payments = await Payment.find(options)
//         .sort({ invoiceCreationDate: -1 })
//         .skip(+skip)
//         .limit(+limit)
//         .populate('company')
//         .populate('street')
//         .populate('domain')
//         .populate('monthService')

//       const streetsPipeline = getStreetsPipeline(isGlobalAdmin, options.domain)

//       const streets = await Payment.aggregate(streetsPipeline)
//       const addressFilter = getFilterForAddress(streets)

//       const total = await Payment.countDocuments(options)

//       const { distinctDomains, distinctCompanies } =
//         await getDistinctCompanyAndDomain({
//           isGlobalAdmin,
//           user,
//           companyGroup: 'company',
//           model: Payment,
//         })

//       const creditDebitPipeline = getCreditDebitPipeline(options)
//       const totalPayments = await Payment.aggregate(creditDebitPipeline)

//       const invoicesPipeline = getInvoicesTotalPipeline(options)
//       const totalInvoices = await Payment.aggregate(invoicesPipeline)

//       const genralSumPipeline = getTotalGeneralSumPipeline(options)
//       const totalGeneralSum = await Payment.aggregate(genralSumPipeline)

//       const totalPaymentsData = [
//         ...totalPayments,
//         ...totalInvoices,
//         ...totalGeneralSum,
//       ]

//       return res.status(200).json({
//         currentCompaniesCount: distinctCompanies.length,
//         currentDomainsCount: distinctDomains.length,
//         domainsFilter: distinctDomains?.map(({ domainDetails }) => ({
//           text: domainDetails.name,
//           value: domainDetails._id,
//         })),
//         realEstatesFilter: distinctCompanies?.map(({ companyDetails }) => ({
//           text: companyDetails.companyName,
//           value: companyDetails._id,
//         })),
//         addressFilter: addressFilter,
//         data: payments,
//         totalPayments: totalPaymentsData.reduce((acc, item) => {
//           acc[item._id] = item.totalSum
//           return acc
//         }, {}),
//         success: true,
//         total,
//       })
//     } catch (error) {
//       return res.status(500).json({ success: false, error: error.message })
//     }
//   } else if (req.method === 'POST') {
//     try {
//       if (isAdmin) {
//         await postValidateBody(req, res)
//         /* eslint-disable @typescript-eslint/ban-ts-comment */
//         // @ts-ignore
//         const payment = await Payment.create(req.body)
//         return res.status(200).json({ success: true, data: payment })
//       } else {
//         return (
//           res
//             .status(400)
//             /* eslint-disable @typescript-eslint/ban-ts-comment */
//             // @ts-ignore
//             .json({ success: false, message: 'not allowed' })
//         )
//       }
//     } catch (error) {
//       // const errors = postValidateBody(req)
//       /* eslint-disable @typescript-eslint/ban-ts-comment */
//       // @ts-ignore
//       return res.status(400).json({ success: false, message: error })
//     }
//   }
// }

// function filterPeriodOptions(args) {
//   const { year, quarter, month, day } = args
//   const filterByDateOptions = []
//   if (year) {
//     filterByDateOptions.push({
//       $eq: [{ $year: '$invoiceCreationDate' }, year],
//     })
//   }
//   if (quarter) {
//     filterByDateOptions.push({
//       $in: [{ $month: '$invoiceCreationDate' }, quarters[+quarter]],
//     })
//   }
//   if (month) {
//     filterByDateOptions.push({
//       $eq: [{ $month: '$invoiceCreationDate' }, month],
//     })
//   }
//   if (day) {
//     filterByDateOptions.push({
//       $eq: [{ $dayOfMonth: '$invoiceCreationDate' }, day],
//     })
//   }
//   return filterByDateOptions
// }
