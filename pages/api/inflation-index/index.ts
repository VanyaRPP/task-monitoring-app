import InflationIndex, { IInflationIndex } from '@modules/models/InflationIndex'
import { Data } from '@pages/api/api.config'
import { withErrorHandler } from '@utils/api-handler'
import {
  isWithinPeriod,
  parsePeriod,
  periodKey,
} from '@utils/debt-calculation/months'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { NextApiRequest, NextApiResponse } from 'next'

interface IIndexInput {
  year: number
  month: number
  value: number
}

interface IYearFilter {
  $gte?: number
  $lte?: number
}

const parseItems = (raw: unknown): { items: IIndexInput[]; error?: string } => {
  const list = Array.isArray(raw) ? raw : [raw]
  const items: IIndexInput[] = []

  for (const entry of list) {
    const { year, month, value } = (entry ?? {}) as Partial<IInflationIndex>

    if (!Number.isInteger(year) || year < 1900 || year > 2200) {
      return { items: [], error: `Некоректний рік: ${year}` }
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return { items: [], error: `Некоректний місяць: ${month}` }
    }
    if (!Number.isFinite(value) || value <= 0) {
      return { items: [], error: `Некоректний індекс: ${value}` }
    }

    items.push({ year, month, value })
  }

  if (items.length === 0) {
    return { items: [], error: 'Порожній список індексів' }
  }

  return { items }
}

async function inflationIndexHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isAdmin } = await getCurrentUser(req, res)

  switch (req.method) {
    case 'GET': {
      // Derzhstat's CPI is a public reference table, so any authenticated user
      // may read it. Writing, below, stays admin-only.
      const from = parsePeriod(req.query.from as string)
      const to = parsePeriod(req.query.to as string)

      // Narrow the query by year and apply the exact month bounds in memory:
      // the table runs to dozens of rows a year, and this beats an $expr.
      const filter: { year?: IYearFilter } = {}
      if (from || to) {
        filter.year = {}
        if (from) filter.year.$gte = from.year
        if (to) filter.year.$lte = to.year
      }

      const list = await InflationIndex.find(filter).lean()
      const data = list
        .filter((item) => isWithinPeriod(item, from, to))
        .sort((a, b) => periodKey(a) - periodKey(b))

      return res.status(200).json({ success: true, data })
    }

    case 'POST': {
      if (!isAdmin) {
        return res
          .status(403)
          .json({ success: false, message: 'Немає доступу' })
      }

      const { items, error } = parseItems(req.body?.items ?? req.body)
      if (error) {
        return res.status(400).json({ success: false, message: error })
      }

      await InflationIndex.bulkWrite(
        items.map(({ year, month, value }) => ({
          updateOne: {
            filter: { year, month },
            update: { $set: { value } },
            upsert: true,
          },
        }))
      )

      const saved = await InflationIndex.find({
        $or: items.map(({ year, month }) => ({ year, month })),
      }).lean()

      return res.status(200).json({
        success: true,
        data: saved.sort((a, b) => periodKey(a) - periodKey(b)),
      })
    }

    default:
      return res
        .status(405)
        .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }
}

export default withErrorHandler(inflationIndexHandler)
