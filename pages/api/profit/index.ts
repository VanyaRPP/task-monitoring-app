/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '@pages/api/api.config'
import Domain from '@modules/models/Domain'
import Payment from '@modules/models/Payment'
import { getCurrentUser } from '@utils/getCurrentUser'
import _groupBy from 'lodash/groupBy'
import dayjs from 'dayjs'
import Credit from '@modules/models/Credit'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

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

        const paymentsOptions: FilterQuery<typeof Payment> = {
          ...(isDomainAdmin && { domain: { $in: domainsIds } }),
          invoiceCreationDate: {
            $gte: fourMonthsAgo,
            $lte: currentDate.toDate(),
          },
          type: 'credit',
        }

        const creditOptions: FilterQuery<typeof Credit> = {
          ...(isDomainAdmin && { domain: { $in: domainsIds } }),
          date: {
            $gte: fourMonthsAgo,
            $lte: currentDate.toDate(),
          },
        }

        if (isDomainAdmin) {
          const adminDomains = await Domain.find({
            adminEmails: user.email,
          })
          const domainIds = adminDomains.map((domain) => domain._id)

          paymentsOptions.domain = { $in: domainIds }
          creditOptions.domain = { $in: domainIds }
        }

        const payments = await Payment.find(paymentsOptions)
        const credits = await Credit.find(creditOptions)

        const paymentsGroupedByMonth = _groupBy(payments, (payment) =>
          dayjs(payment.invoiceCreationDate).format('YYYY-MM')
        )

        const creditsGroupedByMonth = _groupBy(credits, (credit) =>
          dayjs(credit.date).format('YYYY-MM')
        )

        const result = []

        const allMonths = new Set([
          ...Object.keys(paymentsGroupedByMonth),
          ...Object.keys(creditsGroupedByMonth),
        ])

        allMonths.forEach((month) => {
          const paymentsForMonth = paymentsGroupedByMonth[month] || []
          const creditsForMonth = creditsGroupedByMonth[month] || []

          const totalGeneralSumDebit = paymentsForMonth.reduce(
            (acc, payment) => acc + payment.generalSum,
            0
          )

          const totalGeneralSumCredit = creditsForMonth.reduce(
            (acc, credit) => acc + credit.sum,
            0
          )

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
      break
    case 'POST':
      try {
        const { sum, description } = req.body

        if (!sum || !description) {
          return res
            .status(400)
            .json({ success: false, message: 'Missing required fields' })
        }

        const cost = await Credit.create(req.body)

        res.status(200).json({
          success: true,
          message: 'Credit added successfully',
        })
      } catch (error) {
        res.status(500).json({ success: false, message: error.message })
      }
      break
  }
}
