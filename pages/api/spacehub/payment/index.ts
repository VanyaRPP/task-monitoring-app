import initMiddleware from '@common/lib/initMiddleware'
import validateMiddleware from '@common/lib/validateMiddleware'
import Domain from '@common/modules/models/Domain'
import Payment from '@common/modules/models/Payment'
import RealEstate from '@common/modules/models/RealEstate'
import start, { ExtendedData } from '@pages/api/api.config'
import {
  getCreditDebitPipeline,
  getInvoicesTotalPipeline,
  getTotalGeneralSumPipeline,
} from '@pages/api/spacehub/payment/pipelines'
import { quarters } from '@utils/constants'
import { getCurrentUser } from '@utils/getCurrentUser'
import {
  getDistinctCompanyAndDomain,
  getFilterForAddress,
} from '@utils/helpers'
import { getStreetsPipeline } from '@utils/pipelines'
import { check, validationResult } from 'express-validator'
import { FilterQuery } from 'mongoose'
import type { NextApiRequest, NextApiResponse } from 'next'

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
  const { isUser, isDomainAdmin, isGlobalAdmin, isAdmin, user } =
    await getCurrentUser(req, res)

  if (req.method === 'GET') {
    try {
      const { streetIds, companyIds, domainIds, limit, skip, type } = req.query

      const companiesIds: string[] | null = companyIds
        ? typeof companyIds === 'string'
          ? companyIds.split(',').map((id) => decodeURIComponent(id))
          : companyIds.map((id) => decodeURIComponent(id))
        : null
      const streetsIds: string[] | null = streetIds
        ? typeof streetIds === 'string'
          ? streetIds.split(',').map((id) => decodeURIComponent(id))
          : streetIds.map((id) => decodeURIComponent(id))
        : null
      const domainsIds: string[] | null = domainIds
        ? typeof domainIds === 'string'
          ? domainIds.split(',').map((id) => decodeURIComponent(id))
          : domainIds.map((id) => decodeURIComponent(id))
        : null

      const options: FilterQuery<typeof Payment> = {}

      if (isGlobalAdmin) {
        if (companiesIds) {
          options.company = { $in: companiesIds }
        }
        if (streetsIds) {
          options.street = { $in: streetIds }
        }
        if (domainsIds) {
          options.domain = { $in: domainsIds }
        }
      } else if (isDomainAdmin) {
        const relatedDomainsIds = (
          await Domain.find({
            adminEmails: user.email,
          })
        ).map((domain) => domain._id.toString())

        const companies = await RealEstate.find({
          ...(companiesIds ? { _id: { $in: companiesIds } } : {}),
          $or: [
            { adminEmails: user.email },
            { domain: { $in: relatedDomainsIds } },
          ],
        })

        options.company = {
          $in: companies.map(({ _id }) => _id.toString()),
        }

        if (streetsIds) {
          options.street = { $in: streetIds }
        }

        const domains = await Domain.find({
          ...(domainsIds ? { _id: { $in: domainsIds } } : {}),
          adminEmails: user.email,
        })

        options.domain = {
          $in: domains.map(({ _id }) => _id.toString()),
        }
      } else if (isUser) {
        const companies = await RealEstate.find({
          ...(companiesIds ? { _id: { $in: companiesIds } } : {}),
          adminEmails: user.email,
          ...(domainIds ? { domain: { $in: domainIds } } : {}),
        })

        options.company = {
          $in: companies.map(({ _id }) => _id.toString()),
        }
        options.domain = {
          $in: companies.map(({ domain }) => domain.toString()),
        }

        if (streetsIds) {
          options.street = { $in: streetIds }
        }
      }

      if (type) {
        options.type = type
      }

      const expr = filterPeriodOptions(req.query)
      if (expr.length > 0) {
        options.$expr = {
          $and: expr,
        }
      }

      const payments = await Payment.find(options)
        .sort({ invoiceCreationDate: -1 })
        .skip(+skip)
        .limit(+limit)
        .populate('company')
        .populate('street')
        .populate('domain')
        .populate('monthService')

      const streetsPipeline = getStreetsPipeline(isGlobalAdmin, options.domain)

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
      return res.status(500).json({ success: false, error: error.message })
    }
  } else if (req.method === 'POST') {
    try {
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
