/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import start from '@pages/api/api.config'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getFormattedDate } from '@assets/features/formatDate'
import Service from '@modules/models/Service'
import Payment from '@modules/models/Payment'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await start()

  if (req.method === 'GET') {
    try {
      const { domainId, streetId, serviceId, type } = req.query
      const options: any = {}
      let dateField = 'date'

      if (type === 'payment') {
        dateField = 'invoiceCreationDate'
      }

      if (domainId) {
        options.domain = {
          $in: domainId.split(',').map((id) => decodeURIComponent(id)),
        }
      }
      if (streetId) {
        options.street = {
          $in: streetId.split(',').map((id) => decodeURIComponent(id)),
        }
      }
      if (serviceId) {
        options._id = {
          $in: serviceId.split(',').map((id) => decodeURIComponent(id)),
        }
      }

      const distinctYears = await (type === 'payment' ? Payment : Service)
        .distinct(dateField, options)
        .then((dates) =>
          [
            ...new Set(
              dates.map((date) => new Date(date).getFullYear()).filter(Boolean)
            ),
          ].sort((a, b) => b - a)
        )

      const distinctMonths = await (type === 'payment' ? Payment : Service)
        .aggregate([
          { $match: options },
          {
            $group: {
              _id: {
                month: { $month: `$${dateField}` },
              },
            },
          },
          { $sort: { '_id.month': 1 } },
        ])
        .then((results) =>
          results.map((result) => result._id.month).filter(Boolean)
        )

      const monthFilter = distinctMonths.map((month) => {
        const date = new Date()
        date.setMonth(month - 1)
        return {
          value: month,
          text: getFormattedDate(date),
        }
      })

      return res.status(200).json({
        success: true,
        yearFilter: distinctYears.map((year) => ({
          value: year,
          text: year.toString(),
        })),
        monthFilter,
      })
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message })
    }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed' })
}
