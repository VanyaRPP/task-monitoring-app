import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose, { PipelineStage } from 'mongoose'
import Payment from '@modules/models/Payment'
import start from '@pages/api/api.config'

start()

type TreeNode = { value: string; text: string; children?: TreeNode[] }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { source, domainIds, companyIds, streetIds } = req.query

    if (source !== 'monthService') {
      return res.status(400).json({
        success: false,
        error: 'Only source=monthService supported',
      })
    }

    const match: any = {}

    if (domainIds) {
      match.domain = {
        $in: String(domainIds)
          .split(',')
          .map((id) => new mongoose.Types.ObjectId(decodeURIComponent(id))),
      }
    }

    if (companyIds) {
      match.company = {
        $in: String(companyIds)
          .split(',')
          .map((id) => new mongoose.Types.ObjectId(decodeURIComponent(id))),
      }
    }

    if (streetIds) {
      match.street = {
        $in: String(streetIds)
          .split(',')
          .map((id) => new mongoose.Types.ObjectId(decodeURIComponent(id))),
      }
    }

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $match: { monthService: { $exists: true, $ne: null } } },
      {
        $addFields: {
          monthServiceObjId: {
            $cond: [
              { $eq: [{ $type: '$monthService' }, 'string'] },
              { $toObjectId: '$monthService' },
              '$monthService',
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'services',
          localField: 'monthServiceObjId',
          foreignField: '_id',
          as: 'serviceDoc',
        },
      },
      { $unwind: { path: '$serviceDoc', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          year: { $year: '$serviceDoc.date' },
          month: { $month: '$serviceDoc.date' },
        },
      },
      {
        $group: {
          _id: {
            year: '$year',
            month: '$month',
          },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
    ]

    const aggRes = await Payment.aggregate(pipeline)

    if (!aggRes.length) {
      return res.status(200).json({ success: true, tree: [] })
    }

    const yearMap = new Map<number, Set<number>>()

    for (const item of aggRes) {
      const y = item._id.year
      const m = item._id.month
      if (!yearMap.has(y)) yearMap.set(y, new Set())
      yearMap.get(y)!.add(m)
    }

    const tree: TreeNode[] = Array.from(yearMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, monthsSet]) => ({
        value: String(year),
        text: String(year),
        children: Array.from(monthsSet)
          .sort((a, b) => a - b)
          .map((m) => ({
            value: `${year}-month-${m}`,
            text: new Date(year, m - 1, 1).toLocaleString('uk-UA', {
              month: 'long',
            }),
          })),
      }))

    return res.status(200).json({ success: true, tree })
  } catch (err: any) {
    console.error('date-tree error:', err)
    return res
      .status(500)
      .json({ success: false, message: err?.message || String(err) })
  }
}
