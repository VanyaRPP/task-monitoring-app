import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { ITransaction } from '@components/Pages/BankTransactions/components/TransactionsTable/components/transactionTypes'
import Payment from '@modules/models/Payment'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const transaction = Array.isArray(req.query.transaction)
        ? req.query.transaction[0]
        : req.query.transaction

      const selectedCompany = req.query.companyId as string

      const parsedTransaction = JSON.parse(transaction)

      if (!transaction) {
        return res
          .status(400)
          .json({ success: false, message: 'Transaction data is required' })
      }

      const allPayments = await Payment.find({
        description:
          parsedTransaction.description +
          ' (taken from the transaction description)',
        company: selectedCompany,
      })

      return res
        .status(200)
        .json({ success: true, matchingPayments: allPayments })
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message })
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: 'Method Not Allowed' })
  }
}
