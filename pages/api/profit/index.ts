/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '@pages/api/api.config'
import Domain from '@modules/models/Domain'
import Payment from '@modules/models/Payment'
import { getCurrentUser } from '@utils/getCurrentUser'
import _groupBy from 'lodash/groupBy'
import dayjs from 'dayjs'

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isDomainAdmin, isGlobalAdmin, isAdmin, user } = await getCurrentUser(
    req,
    res
  )

  if (!isAdmin && !isGlobalAdmin && !isDomainAdmin) {
    return res.status(200).json({ message: 'not allowed', data: {} })
  }

  switch (req.method) {
    case 'GET':
      try {
        const { domainId } = req.query
        const currentDate = dayjs()

        const domainsIds: string[] | null = domainId
          ? typeof domainId === 'string'
            ? domainId.split(',').map((id) => decodeURIComponent(id))
            : domainId.map((id) => decodeURIComponent(id))
          : null
        const fourMonthsAgo = currentDate
          .subtract(12, 'month')
          .startOf('month')
          .toDate()

        const options: FilterQuery<typeof Payment> = {
          ...(isDomainAdmin && { domain: { $in: domainsIds } }),
          invoiceCreationDate: {
            $gte: fourMonthsAgo,
            $lte: currentDate.toDate(),
          },
        }

        if (isDomainAdmin) {
          const adminDomains = await Domain.find({ adminEmails: user.email })
          const domainIds = adminDomains.map((domain) => domain._id)

          options.domain = { $in: domainIds }
        }

        const payments = await Payment.find(options)

        const paymentsGroupedByMonth = _groupBy(payments, (payment) =>
          dayjs(payment.invoiceCreationDate).format('YYYY-MM')
        )

        const result = []

        Object.keys(paymentsGroupedByMonth).forEach((month) => {
          const paymentsForMonth = paymentsGroupedByMonth[month]
          const paymentsByType = _groupBy(paymentsForMonth, 'type')

          const totalGeneralSumCredit =
            paymentsByType.credit?.reduce(
              (acc, payment) => acc + payment.generalSum,
              0
            ) || 0

          const totalGeneralSumDebit =
            paymentsByType.debit?.reduce(
              (acc, payment) => acc + payment.generalSum,
              0
            ) || 0

          result.push({
            totalGeneralSumCredit,
            totalGeneralSumDebit,
            month,
          })
        })

        res.status(200).json({
          success: true,
          from: fourMonthsAgo,
          to: currentDate.toDate(),
          data: result,
        })
      } catch (error) {
        res.status(400).json({ success: false, message: error.message })
      }
  }
}
