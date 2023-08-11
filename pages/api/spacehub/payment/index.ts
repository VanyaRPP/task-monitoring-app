import validateMiddleware from '@common/lib/validateMiddleware'
import type { NextApiRequest, NextApiResponse } from 'next'
import { check, validationResult } from 'express-validator'
import RealEstate from '@common/modules/models/RealEstate'
import initMiddleware from '@common/lib/initMiddleware'
import { getCurrentUser } from '@utils/getCurrentUser'
import Payment from '@common/modules/models/Payment'
import start, { Data } from '@pages/api/api.config'
import { getPaymentOptions } from '@utils/helpers'
import Domain from '@common/modules/models/Domain'
import { quarters } from '@utils/constants'
import {
  getCreditDebitPipeline,
  getRealEstatesPipeline,
  getDomainsPipeline,
} from './pipelines'
import Street from '@common/modules/models/Street'
import Service from '@common/modules/models/Service'

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
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        await (Domain as any).find({});
        await (Street as any).find({});
        await (Service as any).find({});
        await (RealEstate as any).find({});

        const { isDomainAdmin, isUser, user, isGlobalAdmin } =
        await getCurrentUser(req, res)
        const { companyIds, domainIds, email, limit, skip } = req.query

        const options = {} as any
        //   (await getPaymentOptions({
        //   searchEmail: email,
        //   userEmail: user.email,
        // })) as any
        if (isDomainAdmin) {
          const domains = await (Domain as any).find({
            adminEmails: { $in: [user.email] },
          })
          const domainsIds = domains.map((i) => i._id.toString())
          options.domain = { $in: domainsIds }
        }

        if (isUser) {
          const realEstates = await (RealEstate as any).find({
            adminEmails: { $in: [user.email] },
          })
          const realEstatesIds = realEstates.map((i) => i._id.toString())
          options.company = { $in: realEstatesIds }
        }

        if (domainIds) {
          options.domain = filterOptions(options?.domain, domainIds)
        }

        if (companyIds) {
          options.company = filterOptions(options?.company, companyIds)
        }

        const expr = filterPeriodOptions(req.query)
        if (expr.length > 0) {
          options.$expr = {
            $and: expr,
          }
        }

        const payments = await (Payment as any)
          .find(options)
          .sort({ date: -1 })
          .skip(+skip)
          .limit(+limit)
          .populate({ path: 'company', select: '_id companyName' })
          .populate({ path: 'street', select: '_id address city' })
          .populate({ path: 'domain', select: '_id name' })
          .populate({ path: 'monthService', select: '_id date' })

        const total = await Payment.countDocuments(options)

        // TODO: DomainAdmin see all. For filters. Should see only his
        // TODO: fix
        const realEstatesPipeline = getRealEstatesPipeline(
          isGlobalAdmin,
          user.email
        )
        const distinctCompanies = await Payment.aggregate(realEstatesPipeline)

        const domainsPipeline = getDomainsPipeline(isGlobalAdmin, user.email)
        const distinctDomains = await Payment.aggregate(domainsPipeline)

        const creditDebitPipeline = getCreditDebitPipeline(options)
        const totalPayments = await Payment.aggregate(creditDebitPipeline)

        return res.status(200).json({
          // TODO: update Interface
          /* eslint-disable @typescript-eslint/ban-ts-comment */
          // @ts-ignore
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
          data: payments,
          totalPayments: totalPayments.reduce((acc, item) => {
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

function filterOptions(options = {}, filterIds: any) {
  const res = {
    ...options,
  } as any
  const idsFromQueryFilter = (filterIds || '').split(',') || []
  if (res.$in) {
    res.$in = res.$in.filter((i) => idsFromQueryFilter.includes(i))
    return res
  }
  res.$in = idsFromQueryFilter
  return res
}

function filterPeriodOptions(args) {
  const { year, quarter, month, day } = args
  const filterByDateOptions = []
  if (year) {
    filterByDateOptions.push({
      $eq: [{ $year: '$date' }, year],
    })
  }
  if (quarter) {
    filterByDateOptions.push({
      $in: [{ $month: '$date' }, quarters[+quarter]],
    })
  }
  if (month) {
    filterByDateOptions.push({
      $eq: [{ $month: '$date' }, month],
    })
  }
  if (day) {
    filterByDateOptions.push({
      $eq: [{ $dayOfMonth: '$date' }, day],
    })
  }
  return filterByDateOptions
}
