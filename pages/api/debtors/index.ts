import type { NextApiRequest, NextApiResponse } from 'next'
import start from '@pages/api/api.config'
import RealEstate from '@modules/models/RealEstate'
import Payment from '@modules/models/Payment'
import { getCurrentUser } from '@utils/getCurrentUser'

type CompanyWithPayments = {
  companyId: any
  companyName: string
  totalDebt: number
}

type Data = {
  success: boolean
  companies?: CompanyWithPayments[]
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

  switch (req.method) {
    case 'GET':
      try {
        const { isUser, isDomainAdmin, isGlobalAdmin, isAdmin, user } =
          await getCurrentUser(req, res)
        if (isUser) {
          return res.status(401).json({
            success: false,
            message: 'Unauthorized',
          })
        }
        const { domainIds } = req.query

        const domainsIds = Array.isArray(domainIds)
          ? domainIds
          : domainIds.split(',')

        if (
          !domainsIds ||
          domainsIds[0] === '' ||
          domainsIds[0] === 'undefined' ||
          domainsIds[0] === 'null' ||
          domainsIds.length === 0
        ) {
          return res.status(400).json({
            success: false,
            message: 'Domain ID is required',
          })
        }
        const payments = await Payment.find({ domain: { $in: domainsIds } })
        const companies = await RealEstate.find({ domain: { $in: domainsIds } })

        const companyWithPayments = companies
          .map((company) => {
            const companyPayments = payments
              .filter(
                (payment) =>
                  payment?.company?.toString() === company?._id?.toString()
              )
              .map((payment) => ({
                _id: payment?._id.toString() || 'unknown',
                type: payment?.type || 'unknown',
                generalSum: payment?.generalSum || 0,
                monthService: payment?.monthService?.toString() || 'unknown',
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

            let totalCredit = 0
            let totalDebit = 0
            Object.keys(debtPerMonthMap).map((monthService) => {
              const { debit, credit } = debtPerMonthMap[monthService]
              totalCredit += credit
              totalDebit += debit
            })
            const totalDebitFixed = Number(totalDebit.toFixed(2))
            const totalCreditFixed = Number(totalCredit.toFixed(2))

            return {
              companyId: company._id.toString(),
              companyName: company.companyName,
              totalDebt: (totalDebitFixed - totalCreditFixed).toFixed(2),
            }
          })
          .filter((company) => {
            const totalDebt = Number(company?.totalDebt)
            return Number.isFinite(totalDebt) && totalDebt !== 0
          })
          .map((company) => ({
            ...company,
            totalDebt: Number(company.totalDebt),
          }))

        return res.status(200).json({
          success: true,
          companies: companyWithPayments,
        })
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: `Error: ${error.message}`,
        })
      }
  }
}
