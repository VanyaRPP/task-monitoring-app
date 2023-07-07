/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
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

        const options = await getPaymentOptions({
          searchEmail: req.query.email,
          userEmail: user.email,
        })

        if (isDomainAdmin) {
          const domains = await Domain.find({
            adminEmails: { $in: [user.email] },
          })
          const domainsIds = domains.map((i) => i._id)
          options.domain = { $in: domainsIds }
        }

        if (isUser) { 
          const realEstates = await RealEstate.find({
            adminEmails: { $in: [user.email] },
          })
          const realEstatesIds = realEstates.map((i) => i._id)
          options.company = { $in: realEstatesIds }
        }

        const payments = await Payment.find(options)
          .sort({ date: -1 })
          .limit(req.query.limit)
          // TODO: use domain, street
          .populate({ path: 'company', select: '_id companyName' })
          .populate({ path: 'street', select: '_id address city' })
          .populate({ path: 'domain', select: '_id name' })
          .populate({ path: 'monthService', select: '_id date' })

        return res.status(200).json({
          success: true,
          data: payments,
        })
      } catch (error) {
        return res.status(400).json({ success: false })
      }

    case 'POST':
      try {
        const { isAdmin } = await getCurrentUser(req, res)

        if (isAdmin) {
          await postValidateBody(req, res)
          const payment = await Payment.create(req.body)
          return res.status(200).json({ success: true, data: payment })
        } else {
          return res
            .status(400)
            .json({ success: false, message: 'not allowed' })
        }
      } catch (error) {
        // const errors = postValidateBody(req)
        return res.status(400).json({ success: false, message: error })
      }
  }
}
