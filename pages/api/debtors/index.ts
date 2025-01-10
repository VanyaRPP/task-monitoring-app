import type { NextApiRequest, NextApiResponse } from 'next'
import start from '@pages/api/api.config'
import RealEstate from '@modules/models/RealEstate'
import Payment from '@modules/models/Payment'

type PaymentSummary = {
  _id: string
  type: string
  generalSum: number
}

type CompanyWithPayments = {
  companyId: any
  companyName: string
  payments: PaymentSummary[]
  debt: number
}

type Data = {
  success: boolean
  companies: CompanyWithPayments[]
}

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  switch (req.method) {
    case 'GET':
      try {
        const domainId = req.query.domainId
        const payments = await Payment.find({ domain: domainId })
        const companies = await RealEstate.find({ domain: domainId })

        const companyWithPayments = companies
          .map((company) => {
            const companyPayments = payments
              .filter(
                (payment) =>
                  payment.company.toString() === company._id.toString()
              )
              .map((payment) => ({
                _id: payment._id.toString(),
                type: payment.type,
                generalSum: payment.generalSum,
              }))

            let totalDebit = 0
            let totalCredit = 0

            companyPayments.forEach((payment) => {
              if (payment.type === 'debit') {
                totalDebit += payment.generalSum
              } else if (payment.type === 'credit') {
                totalCredit += payment.generalSum
              }
            })

            const debt = totalDebit - totalCredit

            return {
              companyId: company._id.toString(),
              companyName: company.companyName,
              payments: companyPayments,
              debt: debt > 0 ? debt : 0,
            }
          })
          .filter((company) => company.debt > 0)

        return res.status(200).json({
          success: true,
          companies: companyWithPayments,
        })
      } catch (error) {
        return res.status(500)
      }
  }
}
