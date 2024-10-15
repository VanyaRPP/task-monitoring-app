/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import start from '@pages/api/api.config'
import type { NextApiRequest, NextApiResponse } from 'next'
import {getFormattedDate} from "@assets/features/formatDate";
import Service from "@modules/models/Service";

start()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { domainId, streetId, serviceId } = req.query
      const options: any = {}

      if (domainId) {
        options.domain = { $in: domainId.split(',').map((id) => decodeURIComponent(id)) }
      }
      if (streetId) {
        options.street = { $in: streetId.split(',').map((id) => decodeURIComponent(id)) }
      }
      if (serviceId) {
        options._id = { $in: serviceId.split(',').map((id) => decodeURIComponent(id)) }
      }

      const distinctYears = await Service.distinct('date', options).then((dates) =>
        [...new Set(dates.map((date) => new Date(date).getFullYear()))]
      )

      const distinctMonths = await Service.aggregate([
        { $match: options },
        { $group: { _id: { month: { $month: '$date' } } } },
        { $sort: { '_id.month': 1 } },
      ]).then((results) => [...new Set(results.map((result) => result._id.month))])

      const monthFilter = distinctMonths.map((item) => {
        const date = new Date()
        date.setMonth(item - 1)
        return { value: item, text: getFormattedDate(date) }
      })

      return res.status(200).json({
        success: true,
        yearFilter: distinctYears.map((item) => ({
          value: item,
          text: item.toString(),
        })),
        monthFilter,
      })
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message })
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}
