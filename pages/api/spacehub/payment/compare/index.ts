import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { ITransaction } from '@components/Pages/BankTransactions/components/TransactionsTable/components/transactionTypes'
import Payment from '@modules/models/Payment'
import type { NextApiRequest, NextApiResponse } from 'next'

interface CompareTransactionRequestBody {
  transaction: ITransaction
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { transaction } = req.body as CompareTransactionRequestBody

      if (!transaction) {
        return res
          .status(400)
          .json({ success: false, message: 'Transaction data is required' })
      }

      const allPayments = await Payment.find({})

      const isMatch = allPayments.some((payment) =>
        compareTransactions(transaction.OSND, payment.description)
      )

      return res.status(200).json({ success: true, isMatch })
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message })
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: 'Method Not Allowed' })
  }
}

const compareTransactions = (osnd: string, description: string): boolean => {
  return (
    osnd === description ||
    description === `${osnd} (taken from the transaction description)`
  )
}
