/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '@pages/api/api.config'
import { getTransactionsForDateInterval } from './utils/getTransactions/index'
import Payment from '@modules/models/Payment'
import Domain from '@modules/models/Domain'
import { getCurrentUser } from '@utils/getCurrentUser'
import {
  buildFinalTechnicalTransactionId,
  isSelfTransaction,
  normalizeTechnicalTransactionId,
  technicalTransactionIdMatchCandidates,
} from '@components/Pages/BankTransactions/components/TransactionsTable/components/bankHelper'

start()

export function normalizeBankAccount(acc: string | undefined | null) {
  if (acc == null || typeof acc !== 'string') return ''
  return acc.trim()
}

export async function checkTransaction({ transaction, domainId }) {
  try {
    const candidates = technicalTransactionIdMatchCandidates(transaction)

    if (candidates.length > 0) {
      const allPayments = await Payment.find({
        'transaction.TECHNICAL_TRANSACTION_ID': { $in: candidates },
      })

      if (allPayments.length > 0) {
        const company = allPayments[0].company
        return {
          isMatchingPayment: true,
          previousCompanyId: company != null ? String(company) : null,
        }
      }
    }

    const isTransit = transaction.AUT_CNTR_NAM?.includes('Транз')

    if (isTransit && transaction.OSND) {
      const payment = await Payment.findOne({
        'transaction.OSND': transaction.OSND,
      })
        .sort({ invoiceCreationDate: -1 })
        .lean()

      if (payment?.company) {
        return {
          isMatchingPayment: false,
          previousCompanyId: String(payment.company),
        }
      }
    }

    if (!isTransit && !isSelfTransaction(transaction)) {
      const acc = normalizeBankAccount(transaction.AUT_CNTR_ACC)
      if (domainId && acc) {
        const payment = await Payment.findOne({
          domain: domainId,
          $or: [
            { 'transaction.AUT_CNTR_ACC': acc },
            ...(transaction.AUT_CNTR_ACC !== acc
              ? [{ 'transaction.AUT_CNTR_ACC': transaction.AUT_CNTR_ACC }]
              : []),
          ],
        })
          .sort({ invoiceCreationDate: -1 })
          .lean()

        if (payment?.company) {
          return {
            isMatchingPayment: false,
            previousCompanyId: String(payment.company),
          }
        }
      }
    }

    return { isMatchingPayment: false, previousCompanyId: null }
  } catch (error) {
    throw new Error(`${error.message}`)
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin, isDomainAdmin, user } = await getCurrentUser(req, res)

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    })
  }

  if (!isGlobalAdmin && !isDomainAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden',
    })
  }
  const {
    token: tokenQuery,
    startDate,
    limit,
    followId,
    acc,
    domainId,
  } = req.query

  const { token: tokenHeader } = req.headers

  if (!tokenQuery && !tokenHeader) {
    return res
      .status(404)
      .json({ success: false, message: 'Error! No bank token!' })
  }

  const domainIdStr =
    typeof domainId === 'string' && domainId.length > 0 ? domainId : null

  if (domainIdStr && isDomainAdmin && !isGlobalAdmin) {
    const allowed = await Domain.findOne({
      _id: domainIdStr,
      adminEmails: user.email,
    })
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: domain',
      })
    }
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

        const resolvedDomainId =
          domainIdStr && (isGlobalAdmin || isDomainAdmin) ? domainIdStr : null

        const checkedTransactions = await Promise.all(
          transactions.map(async (transaction) => {
            try {
              const matchResult = await checkTransaction({
                transaction,
                domainId: resolvedDomainId,
              })
              return { ...transaction, ...matchResult }
            } catch (error) {
              return {
                ...transaction,
                isMatchingPayment: false,
                previousCompanyId: null,
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
