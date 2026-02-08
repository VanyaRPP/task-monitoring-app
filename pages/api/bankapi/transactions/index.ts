/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '@pages/api/api.config'
import { getTransactionsForDateInterval } from './utils/getTransactions/index'
import Payment from '@modules/models/Payment'
import { toRoundFixed } from '@utils/helpers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@pages/api/auth/[...nextauth]'
import { Roles } from '@utils/constants'

start()

export async function  checkTransaction({ transaction }) {
  try {
    const Sum = +toRoundFixed(transaction.SUM)
    
    const Acc = transaction.AUT_CNTR_ACC?.trim() || ''
    const Nam = transaction.AUT_CNTR_NAM?.trim() || ''
    const Mfo = transaction.AUT_CNTR_MFO?.trim() || ''

    const allPayments = await Payment.find({
      $and: [
        {
          $expr: {
            $eq: [
              { $trim: { input: { $ifNull: ['$transaction.AUT_CNTR_ACC', ''] } } },
              Acc
            ]
          }
        },
        // {
        //   $expr: {
        //     $eq: [
        //       { $trim: { input: { $ifNull: ['$transaction.AUT_CNTR_NAM', ''] } } },
        //       Nam
        //     ]
        //   }
        // },
        // {
        //   $expr: {
        //     $eq: [
        //       { $trim: { input: { $ifNull: ['$transaction.AUT_CNTR_MFO', ''] } } },
        //       Mfo
        //     ]
        //   }
        // },
        { generalSum: Sum },
      ],
    })

    return {
      isMatchingPayment: allPayments.length > 0,
      previousCompanyId: allPayments.length > 0 ? allPayments[0].company : null,
    }
  } catch (error) {
    throw new Error(`${error.message}`)
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      })
    }

    const userRoles = session.user?.roles || []

    const allowedRoles = [Roles.GLOBAL_ADMIN, Roles.DOMAIN_ADMIN]

    const hasAccess = userRoles.some((role) =>
      allowedRoles.includes(role)
    )

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      })
    }
    
  const { token: tokenQuery, startDate, limit, followId, acc } = req.query

  const { token: tokenHeader } = req.headers

  if (!tokenQuery && !tokenHeader) {
    return res
      .status(404)
      .json({ success: false, message: 'Error! No bank token!' })
  }

  switch (req.method) {
    case 'GET':
      try {
        const transactions = await getTransactionsForDateInterval(
          tokenHeader ?? tokenQuery,
          acc,
          startDate,
          limit,
          followId
        )

        const checkedTransactions = await Promise.all(
          transactions.map(async (transaction) => {
            try {
              const isMatchingPayment = await checkTransaction({
                transaction,
              })

              return {
                ...transaction,
                ...isMatchingPayment,
              }
            } catch (error) {
              return {
                ...transaction,
                isMatchingPayment: false,
              }
            }
          })
        )

        return res
          .status(200)
          .json({ success: true, data: checkedTransactions })
      } catch (error) {
        return res.status(400).json({ success: false, message: error.message })
      }

    case 'POST':
      return res
        .status(501)
        .json({ success: false, message: 'not implemented' })

    case 'PATCH':
      return res
        .status(501)
        .json({ success: false, message: 'not implemented' })

    case 'DELETE':
      return res
        .status(501)
        .json({ success: false, message: 'not implemented' })
  }
}
