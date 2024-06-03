import initMiddleware from '@common/lib/initMiddleware'
import validateMiddleware from '@common/lib/validateMiddleware'
import Payment from '@common/modules/models/Payment'
import start, { ExtendedData } from '@pages/api/api.config'
import { quarters } from '@utils/constants'
import { getCurrentUser } from '@utils/getCurrentUser'
import {
  getDistinctCompanyAndDomain,
  getFilterForAddress,
} from '@utils/helpers'
import { getStreetsPipeline } from '@utils/pipelines'
import { check, validationResult } from 'express-validator'
import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getCreditDebitPipeline,
  getInvoicesTotalPipeline,
  getTotalGeneralSumPipeline,
} from './pipelines'

start()

const postValidateBody = initMiddleware(
  validateMiddleware(
    [
      check('date'),
      check(
        'credit',
        'Сума кредита повинна бути цілим значенням в межах [1, 200000]'
      ).optional(),
      check(
        'debit',
        'Сума дебита повинна бути цілим значенням в межах [1, 200000]'
      )
        .isFloat({ min: 0, max: 200000 })
        .optional(),
      check(
        'maintenance.sum',
        'Сума за утримання повинна бути в межах [1, 200000]' // TODO: Change on valid range
      )
        .isFloat({ min: 0, max: 200000 })
        .optional(),
      check(
        'placing.sum',
        'Сума за розміщення повинна бути в межах [1, 200000]' // TODO: Change on valid range
      )
        .isFloat({ min: 0, max: 200000 })
        .optional(),
      check(
        'electricity.sum',
        'Сума за електропостачання повинна бути в межах [1, 200000]' // TODO: Change on valid range
      )
        .isFloat({ min: 0, max: 200000 })
        .optional(),
      check(
        'water.sum',
        'Сума за водопостачання повинна бути в межах [1, 200000]' // TODO: Change on valid range
      )
        .isFloat({ min: 0, max: 200000 })
        .optional(),
      check('description').trim(),
    ],
    validationResult
  )
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtendedData>
) {
  switch (req.method) {
    case 'GET':
      try {
        const { isDomainAdmin, isUser, user, isGlobalAdmin } =
          await getCurrentUser(req, res)
        const { streetIds, companyIds, domainIds, limit, skip, type } =
          req.query

        const options = {
          domain: {
            _id: {
              $in:
                typeof domainIds === 'string'
                  ? [domainIds]
                  : domainIds?.map((id) => id.toString()),
            },
            adminEmail: { $in: [user.email] },
          },
          company: {
            _id: {
              $in:
                typeof companyIds === 'string'
                  ? [companyIds]
                  : companyIds?.map((id) => id.toString()),
            },
            adminEmail: { $in: [user.email] },
          },
          street: {
            _id: {
              $in:
                typeof streetIds === 'string'
                  ? [streetIds]
                  : streetIds?.map((id) => id.toString()),
            },
            adminEmail: { $in: [user.email] },
          },
          type : type,
        }

        if (!isDomainAdmin) {
          delete options.domain.adminEmail
        }

        if (!streetIds) {
          delete options.street
        }

        if (!domainIds) {
          delete options.domain._id
        }

        if (!options.domain.adminEmail && !options.domain._id) {
          delete options.domain
        }

        if (!isUser) {
          delete options.company.adminEmail
        }

        if (!companyIds) {
          delete options.company._id
        }

        if (!options.company.adminEmail && !options.company._id) {
          delete options.company
        }

        // if (!options.street.adminEmail && !options.street._id) {
        //   delete options.street
        // }

        if (!type) {
          delete options.type
        }

        // if (isDomainAdmin) {
        //   const domains = await (Domain as any).find({
        //     adminEmails: { $in: [user.email] },
        //   })
        //   const domainsIds = domains.map((i) => i._id.toString())
        //   options.domain = { $in: domainsIds }
        // }

        // if (isUser) {
        //   const realEstates = await (RealEstate as any).find({
        //     adminEmails: { $in: [user.email] },
        //   })
        //   const realEstatesIds = realEstates.map((i) => i._id.toString())
        //   options.company = { $in: realEstatesIds }
        // }

        // if (domainIds) {
        //   options.domain = filterOptions(options?.domain, domainIds)
        // }

        // if (companyIds) {
        //   options.company = filterOptions(options?.company, companyIds)
        // }

        // if (streetIds) {
        //   options.street = filterOptions(options?.street, streetIds)
        // }

        // const expr = filterPeriodOptions(req.query)
        // if (expr.length > 0) {
        //   options.$expr = {
        //     $and: expr,
        //   }
        // }

        // if (type) {
        //   options.type = type
        // }

        const payments = await Payment.find(options)
          .sort({ invoiceCreationDate: -1 })
          .skip(+skip)
          .limit(+limit)
          .populate('company')
          .populate('street')
          .populate('domain')
          .populate('monthService')

        const streetsPipeline = getStreetsPipeline(
          isGlobalAdmin,
          options.domain
        )

        const streets = await Payment.aggregate(streetsPipeline)
        const addressFilter = getFilterForAddress(streets)

        const total = await Payment.countDocuments(options)

        const { distinctDomains, distinctCompanies } =
          await getDistinctCompanyAndDomain({
            isGlobalAdmin,
            user,
            companyGroup: 'company',
            model: Payment,
          })

        const creditDebitPipeline = getCreditDebitPipeline(options)
        const totalPayments = await Payment.aggregate(creditDebitPipeline)

        const invoicesPipeline = getInvoicesTotalPipeline(options)
        const totalInvoices = await Payment.aggregate(invoicesPipeline)

        const genralSumPipeline = getTotalGeneralSumPipeline(options)
        const totalGeneralSum = await Payment.aggregate(genralSumPipeline)

        const totalPaymentsData = [
          ...totalPayments,
          ...totalInvoices,
          ...totalGeneralSum,
        ]

        return res.status(200).json({
          currentCompaniesCount: distinctCompanies.length,
          currentDomainsCount: distinctDomains.length,
          domainsFilter: distinctDomains?.map(({ domainDetails }) => ({
            text: domainDetails.name,
            value: domainDetails._id,
          })),
          realEstatesFilter: distinctCompanies?.map(({ companyDetails }) => ({
            text: companyDetails.companyName,
            value: companyDetails._id,
          })),
          addressFilter: addressFilter,
          data: payments,
          totalPayments: totalPaymentsData.reduce((acc, item) => {
            acc[item._id] = item.totalSum
            return acc
          }, {}),
          success: true,
          total,
        })
      } catch (error) {
        return res.status(400).json({ success: false, error: error.message })
      }

    case 'POST':
      try {
        const { isAdmin } = await getCurrentUser(req, res)

        if (isAdmin) {
          await postValidateBody(req, res)
          /* eslint-disable @typescript-eslint/ban-ts-comment */
          // @ts-ignore
          const payment = await Payment.create(req.body)
          return res.status(200).json({ success: true, data: payment })
        } else {
          return (
            res
              .status(400)
              /* eslint-disable @typescript-eslint/ban-ts-comment */
              // @ts-ignore
              .json({ success: false, message: 'not allowed' })
          )
        }
      } catch (error) {
        // const errors = postValidateBody(req)
        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        return res.status(400).json({ success: false, message: error })
      }
  }
}

function filterPeriodOptions(args) {
  const { year, quarter, month, day } = args
  const filterByDateOptions = []
  if (year) {
    filterByDateOptions.push({
      $eq: [{ $year: '$invoiceCreationDate' }, year],
    })
  }
  if (quarter) {
    filterByDateOptions.push({
      $in: [{ $month: '$invoiceCreationDate' }, quarters[+quarter]],
    })
  }
  if (month) {
    filterByDateOptions.push({
      $eq: [{ $month: '$invoiceCreationDate' }, month],
    })
  }
  if (day) {
    filterByDateOptions.push({
      $eq: [{ $dayOfMonth: '$invoiceCreationDate' }, day],
    })
  }
  return filterByDateOptions
}
