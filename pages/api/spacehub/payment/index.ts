import validateMiddleware from '@common/lib/validateMiddleware'
import type { NextApiRequest, NextApiResponse } from 'next'
import { check, validationResult } from 'express-validator'
import RealEstate from '@common/modules/models/RealEstate'
import initMiddleware from '@common/lib/initMiddleware'
import { getCurrentUser } from '@utils/getCurrentUser'
import Payment from '@common/modules/models/Payment'
import start, { Data } from 'pages/api/api.config'
import { getPaymentOptions } from '@utils/helpers'
import Domain from '@common/modules/models/Domain'
import { quarters } from '@utils/constants'

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
        const { isDomainAdmin, isUser, user } = await getCurrentUser(req, res)

        const options = (await getPaymentOptions({
          searchEmail: req.query.email,
          userEmail: user.email,
        })) as any

        if (isDomainAdmin) {
          /* eslint-disable @typescript-eslint/ban-ts-comment */
          // @ts-ignore
          const domains = await Domain.find({
            adminEmails: { $in: [user.email] },
          })
          const domainsIds = domains.map((i) => i._id)
          options.domain = { $in: domainsIds }
        }

        if (isUser) {
          /* eslint-disable @typescript-eslint/ban-ts-comment */
          // @ts-ignore
          const realEstates = await RealEstate.find({
            adminEmails: { $in: [user.email] },
          })
          const realEstatesIds = realEstates.map((i) => i._id)
          options.company = { $in: realEstatesIds }
        }

        const filterByDateOptions = []
        const { year, quarter, month, day } = req.query

        if (year) {
          filterByDateOptions.push({
            $eq: [{ $year: '$date' }, year],
          })
        }
        if (quarter) {
          filterByDateOptions.push({
            // @ts-ignore
            $in: [{ $month: '$date' }, quarters[quarter]],
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

        options.$expr = {
          $and: filterByDateOptions,
        }

        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        const payments = await Payment.find(options)
          .sort({ date: -1 })
          .skip(req.query.skip)
          .limit(req.query.limit)
          .populate({ path: 'company', select: '_id companyName' })
          .populate({ path: 'street', select: '_id address city' })
          .populate({ path: 'domain', select: '_id name' })
          .populate({ path: 'monthService', select: '_id date' })

        const total = await Payment.countDocuments(options)

        const companies = payments
          .map((item) => item?.company?._id)
          .filter(Boolean)
        const domains = payments
          .map((item) => item?.domain?._id)
          .filter(Boolean)

        const domainsPipeline = [
          {
            $group: {
              _id: '$domain',
            },
          },
          {
            $lookup: {
              from: 'domains',
              localField: '_id',
              foreignField: '_id',
              as: 'domainDetails',
            },
          },
          {
            $unwind: '$domainDetails',
          },
          {
            $project: {
              'domainDetails.name': 1,
              'domainDetails._id': 1
            },
          },
        ]

        const realEstatesPipeline = [
          {
            $group: {
              _id: '$company',
            },
          },
          {
            $lookup: {
              from: 'realestates',
              localField: '_id',
              foreignField: '_id',
              as: 'companyDetails',
            },
          },
          {
            $unwind: '$companyDetails',
          },
          {
            $project: {
              'companyDetails.companyName': 1,
              'companyDetails._id': 1
            },
          },
        ]

        const distinctDomains = await Payment.aggregate(domainsPipeline)
        const distinctCompanies = await Payment.aggregate(realEstatesPipeline)

        return res.status(200).json({
          /* eslint-disable @typescript-eslint/ban-ts-comment */
          // @ts-ignore
          currentCompaniesCount: new Set(companies).size,
          currentDomainsCount: new Set(domains).size,
          domainsFilter: distinctDomains?.map(({ domainDetails }) => ({
            text: domainDetails.name,
            value: domainDetails._id,
          })),
          realEstatesFilter: distinctCompanies?.map(({ companyDetails }) => ({
            text: companyDetails.companyName,
            value: companyDetails._id,
          })),
          data: payments,
          success: true,
          total,
        })
      } catch (error) {
        return res.status(400).json({ success: false })
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
