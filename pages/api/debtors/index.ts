import type { NextApiRequest, NextApiResponse } from 'next'
import start from '@pages/api/api.config'
import RealEstate from '@modules/models/RealEstate'
import Payment from '@modules/models/Payment'

type DebtPerMonth = {
  monthService: string
  totalDue: number
  paid: number
  remaining: number
}

type CompanyWithPayments = {
  companyId: any
  companyName: string
  debtPerMonth: DebtPerMonth[]
  totalDebt: number
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
                monthService: payment.monthService.toString(),
              }))

            const debtPerMonthMap: {
              [monthService: string]: { debit: number; credit: number }
            } = {}

            companyPayments.forEach((payment) => {
              const { monthService, type, generalSum } = payment

              if (!debtPerMonthMap[monthService]) {
                debtPerMonthMap[monthService] = { debit: 0, credit: 0 }
              }

              if (type === 'debit') {
                debtPerMonthMap[monthService].debit += generalSum
              } else if (type === 'credit') {
                debtPerMonthMap[monthService].credit += generalSum
              }
            })

            let totalDebt = 0
            const debtPerMonthArray = Object.keys(debtPerMonthMap).map(
              (monthService) => {
                const { debit, credit } = debtPerMonthMap[monthService]
                const remaining = debit - credit
                totalDebt += remaining > 0 ? remaining : 0

                return {
                  monthService,
                  totalDue: debit,
                  paid: credit,
                  remaining: remaining > 0 ? remaining : 0,
                }
              }
            )

            return {
              companyId: company._id.toString(),
              companyName: company.companyName,
              debtPerMonth: debtPerMonthArray,
              totalDebt,
            }
          })
          .filter((company) => company.totalDebt > 0)

        return res.status(200).json({
          success: true,
          companies: companyWithPayments,
        })
      } catch (error) {
        return res.status(500)
      }
  }
}
