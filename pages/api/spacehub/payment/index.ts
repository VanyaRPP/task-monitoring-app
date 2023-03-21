/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from 'pages/api/api.config'
import Payment from '@common/modules/models/Payment'
import { check, validationResult } from 'express-validator'
import initMiddleware from '@common/lib/initMiddleware'
import validateMiddleware from '@common/lib/validateMiddleware'
import { getServerSession } from 'next-auth'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import { getPaymentOptions } from '@utils/helpers'

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
        const session = await getServerSession(req, res, authOptions)

        const options = await getPaymentOptions({
          searchEmail: req.query.email,
          userEmail: session.user.email,
        })

        const payments = await Payment.find(options)
          .sort({ date: -1 })
          .limit(req.query.limit)
          .populate({ path: 'payer', select: '_id email' })

        return res.status(200).json({
          success: true,
          data: payments,
        })
      } catch (error) {
        return res.status(400).json({ success: false })
      }
    case 'POST':
      try {
        await postValidateBody(req, res)
        const payment = await Payment.create(req.body)

        return res.status(200).json({ success: true, data: payment })
      } catch (error) {
        const errors = postValidateBody(req)
        return res.status(400).json({ errors: errors.array() })
      }
  }
}
