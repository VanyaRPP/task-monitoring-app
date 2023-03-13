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
import User from '@common/modules/models/User'
import { Roles } from '@utils/constants'
import { getPaymentsOnBE } from '@utils/helpers'

start()

const postValidateBody = initMiddleware(
  validateMiddleware(
    [
      check('date'),
      check(
        'credit',
        'Сума кредита повинна бути цілим значенням в межах [1, 10000]'
      )
        .isInt({ min: 1, max: 200000 })
        .optional(),
      check(
        'debit',
        'Сума кредита повинна бути цілим значенням в межах [1, 10000]'
      )
        .isInt({ min: 1, max: 200000 })
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
        const user = await User.findOne({ email: session.user.email })
        const isAdmin = user?.role === Roles.ADMIN
        const userIdByEmail = await User.findOne({
          email: req.query.userId,
        })

        const payments = await Payment.find(
          getPaymentsOnBE({
            isAdmin: isAdmin,
            req: req.query.userId as string,
            userIdByEmail: userIdByEmail?._id as string,
          })
        )
          .sort({ date: -1 })
          .limit(req.query.limit)
          .populate('payer')

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
