import ProfitModel, { ProfitDocument } from '@modules/models/Profit'
import Payment from '@common/modules/models/Payment'
import mongoose, { Types } from 'mongoose'

export interface CreateProfitInput {
  domain: Types.ObjectId | string
  payment?: Types.ObjectId | string
  createdBy?: Types.ObjectId | string
  amount: number
  type: 'debit' | 'credit'
  categories?: string[]
  description?: string
  invoiceNumber?: string
  date: Date
  /** `YYYY-MM`; which month the record belongs to. */
  periodMonth?: string
  currency?: string
}

export interface CurrencyTotals {
  /** Invoiced to clients this month. */
  expected: number
  /** Money that actually arrived this month. */
  actual: number
  /** What the domain spent this month. */
  expenses: number
  /** expected - actual: invoiced but not yet collected. */
  outstanding: number
  /** actual - expenses */
  net: number
}

export interface ProfitMonthLedger {
  /** `YYYY-MM`, sortable and safe to hand to dayjs. */
  month: string
  /**
   * Every figure is per-currency: a domain can invoice in UAH and USD, and
   * those sums must never be added together without an explicit rate.
   * Ordered by turnover, so `currencies[0]` is the one worth showing first.
   */
  currencies: string[]
  byCurrency: Record<string, CurrencyTotals>
  invoiceCount: number
  paymentCount: number
  /** Manual Profit records behind `expenses` / manual income. */
  transactions: any[]
}

class ProfitService {
  static async getAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [records, total] = await Promise.all([
      ProfitModel.find()
        .populate({
          path: 'createdBy',
          select: '_id name email',
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      ProfitModel.countDocuments(),
    ])

    return {
      data: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getAllWithMonthSeparation(page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [groupedData, total] = await Promise.all([
      ProfitModel.aggregate([
        { $sort: { date: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users', // collection name
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy',
          },
        },
        {
          $unwind: {
            path: '$createdBy',
            preserveNullAndEmptyArrays: true, // in case user was deleted
          },
        },
        {
          $project: {
            domain: 1,
            payment: 1,
            createdBy: {
              _id: 1,
              name: 1,
              email: 1,
            },
            amount: 1,
            type: 1,
            categories: 1,
            description: 1,
            invoiceNumber: 1,
            date: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            profits: { $push: '$$ROOT' },
          },
        },
        {
          $sort: {
            '_id.year': -1,
            '_id.month': -1,
          },
        },
      ]),
      ProfitModel.countDocuments(),
    ])

    const data: Record<string, ProfitDocument[]> = {}
    for (const group of groupedData) {
      const { year, month } = group._id
      const monthName = new Date(year, month - 1).toLocaleString('en-US', {
        month: 'long',
      })
      const key = `${monthName} ${year}`
      data[key] = group.profits
    }

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getByDomain(domainId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [records, total] = await Promise.all([
      ProfitModel.find({ domain: domainId })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      ProfitModel.countDocuments({ domain: domainId }),
    ])

    return {
      data: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Monthly ledger for one domain.
   *
   * Three separate concepts, per the agreed model:
   *   expected - invoices issued to clients   (Payment, type "debit")
   *   actual   - money that actually arrived  (Payment, type "credit")
   *   expenses - what the domain itself spent (Profit, type "debit")
   *
   * Income is read straight from Payment rather than mirrored into Profit,
   * so the two can no longer drift apart. Profit now only holds the domain's
   * own costs (rent, utilities, contractors) plus the rare manual income
   * entry that has no invoice behind it.
   *
   * Pagination applies to MONTHS, not to individual records - the previous
   * implementation sliced records before grouping, which made every month
   * total a partial sum of whatever landed on the current page.
   */
  static async getByDomainWithMonthSeparation(
    domainId: string,
    page = 1,
    limit = 12
  ) {
    const domain = new mongoose.Types.ObjectId(domainId)

    const [incomeGroups, expenseGroups] = await Promise.all([
      Payment.aggregate([
        { $match: { domain } },
        {
          // `monthService` is a Mixed field holding a STRING id, so it never
          // matches services._id directly. $convert with onError keeps legacy
          // or blank values from blowing up the whole pipeline.
          $addFields: {
            monthServiceId: {
              $convert: {
                input: '$monthService',
                to: 'objectId',
                onError: null,
                onNull: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: 'services',
            localField: 'monthServiceId',
            foreignField: '_id',
            as: 'service',
          },
        },
        {
          $project: {
            generalSum: 1,
            type: 1,
            currency: 1,
            // A payment belongs to the month it is FOR, not the month it was
            // issued or settled - June invoices are routinely paid in July,
            // and "за червень" is the spine of this app. Rows with no month
            // service (legacy data) fall back to their own dates so they land
            // somewhere instead of disappearing from the totals.
            effectiveDate: {
              $ifNull: [
                { $arrayElemAt: ['$service.date', 0] },
                {
                  $cond: [
                    { $eq: ['$type', 'credit'] },
                    { $ifNull: ['$paidAt', '$invoiceCreationDate'] },
                    '$invoiceCreationDate',
                  ],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$effectiveDate' },
              month: { $month: '$effectiveDate' },
              // Records predating multi-currency have no field at all.
              currency: { $ifNull: ['$currency', 'UAH'] },
            },
            expected: {
              $sum: {
                $cond: [{ $eq: ['$type', 'debit'] }, '$generalSum', 0],
              },
            },
            actual: {
              $sum: {
                $cond: [{ $eq: ['$type', 'credit'] }, '$generalSum', 0],
              },
            },
            invoiceCount: {
              $sum: { $cond: [{ $eq: ['$type', 'debit'] }, 1, 0] },
            },
            paymentCount: {
              $sum: { $cond: [{ $eq: ['$type', 'credit'] }, 1, 0] },
            },
          },
        },
      ]),
      ProfitModel.aggregate([
        { $match: { domain } },
        { $sort: { date: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy',
          },
        },
        {
          $unwind: {
            path: '$createdBy',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            domain: 1,
            payment: 1,
            createdBy: { _id: 1, name: 1, email: 1 },
            amount: 1,
            type: 1,
            categories: 1,
            description: 1,
            invoiceNumber: 1,
            date: 1,
            periodMonth: 1,
            currency: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          // Same rule on the expense side: `periodMonth` says which month the
          // cost belongs to; without it, the month it was paid in.
          $addFields: {
            monthKey: {
              $ifNull: [
                '$periodMonth',
                { $dateToString: { format: '%Y-%m', date: '$date' } },
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              monthKey: '$monthKey',
              currency: { $ifNull: ['$currency', 'UAH'] },
            },
            expenses: {
              $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] },
            },
            // Income booked by hand, with no invoice behind it.
            manualIncome: {
              $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] },
            },
            transactions: { $push: '$$ROOT' },
          },
        },
      ]),
    ])

    // Income groups by {year, month}; expenses already group on a `YYYY-MM`
    // string because their key can come straight from `periodMonth`.
    const incomeKey = (g: {
      _id: { year: number; month: number; currency: string }
    }) => `${g._id.year}-${String(g._id.month).padStart(2, '0')}`

    const months = new Map<string, ProfitMonthLedger>()
    const blank = (month: string): ProfitMonthLedger => ({
      month,
      currencies: [],
      byCurrency: {},
      invoiceCount: 0,
      paymentCount: 0,
      transactions: [],
    })

    const bucket = (entry: ProfitMonthLedger, currency: string) => {
      if (!entry.byCurrency[currency]) {
        entry.byCurrency[currency] = {
          expected: 0,
          actual: 0,
          expenses: 0,
          outstanding: 0,
          net: 0,
        }
      }
      return entry.byCurrency[currency]
    }

    for (const g of incomeGroups) {
      const key = incomeKey(g)
      const entry = months.get(key) ?? blank(key)
      const totals = bucket(entry, g._id.currency)
      totals.expected += g.expected
      totals.actual += g.actual
      entry.invoiceCount += g.invoiceCount
      entry.paymentCount += g.paymentCount
      months.set(key, entry)
    }

    for (const g of expenseGroups) {
      const key: string = g._id.monthKey
      const entry = months.get(key) ?? blank(key)
      const totals = bucket(entry, g._id.currency)
      totals.expenses += g.expenses
      totals.actual += g.manualIncome
      // One month can produce several expense groups (one per currency), so
      // append rather than overwrite.
      entry.transactions = [...entry.transactions, ...g.transactions]
      months.set(key, entry)
    }

    for (const entry of months.values()) {
      for (const totals of Object.values(entry.byCurrency)) {
        totals.outstanding = totals.expected - totals.actual
        totals.net = totals.actual - totals.expenses
      }
      // Busiest currency first - that is the one worth reading at a glance.
      entry.currencies = Object.keys(entry.byCurrency).sort((a, b) => {
        const volume = (c: string) => {
          const t = entry.byCurrency[c]
          return (
            Math.abs(t.expected) + Math.abs(t.actual) + Math.abs(t.expenses)
          )
        }
        return volume(b) - volume(a)
      })
    }

    // Newest month first, then page over months.
    const ordered = [...months.values()].sort((a, b) =>
      b.month.localeCompare(a.month)
    )
    const total = ordered.length
    const skip = (page - 1) * limit
    const pageRows = ordered.slice(skip, skip + limit)

    const data: Record<string, ProfitMonthLedger> = {}
    for (const row of pageRows) {
      data[row.month] = row
    }

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  static async getById(id: string) {
    return ProfitModel.findById(id).populate('domain')
  }

  static async create(data: CreateProfitInput) {
    try {
      const profit = await ProfitModel.create(data)
      return profit
    } catch (error) {
      console.error('Failed to create Profit record:', error)
      throw new Error('Unable to create profit. Please try again later.')
    }
  }

  static async bulkCreate(data: CreateProfitInput[]) {
    if (!data.length) throw new Error('No records to insert')
    return await ProfitModel.insertMany(data)
  }

  static async update(
    id: string,
    data: Partial<{
      amount: number
      type: 'debit' | 'credit'
      categories: string[]
      description: string
      date: Date
      periodMonth: string
      currency: string
    }>
  ) {
    return ProfitModel.findByIdAndUpdate(id, data, { new: true })
  }

  static async delete(id: string) {
    return ProfitModel.findByIdAndDelete(id)
  }
  static async getBalance(domainId: string) {
    const records = await ProfitModel.find({ domain: domainId })

    let balance = 0
    for (const record of records) {
      if (record.type === 'credit') {
        balance += record.amount
      } else {
        balance -= record.amount
      }
    }

    return balance
  }
}

export default ProfitService
