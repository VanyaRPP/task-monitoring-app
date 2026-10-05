import ProfitModel, { ProfitDocument } from '@modules/models/Profit'
import Payment from '@common/modules/models/Payment'
import mongoose, { Types } from 'mongoose'

export interface CreateProfitInput {
  /** Exactly one of domain/company - see ProfitDocument for why. */
  domain?: Types.ObjectId | string
  company?: Types.ObjectId | string
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
  /** Invoiced this month. */
  expected: number
  /** Invoiced money that actually moved this month. */
  actual: number
  /** Hand-entered `credit` records - income that no invoice produced. */
  income: number
  /** Hand-entered `debit` records. */
  expenses: number
  /** expected - actual: invoiced but not yet settled. */
  outstanding: number
  /** What is left once everything above is applied; sign carries meaning. */
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
  /**
   * The Payment half of a ledger - expected/actual income, grouped by month
   * and currency. Shared by the domain and company scopes; they differ only
   * in which field they match on (a domain owns its overhead costs, a
   * company never does, so the Profit/expenses half is NOT shared - see
   * getByDomainWithMonthSeparation vs getByCompanyWithMonthSeparation).
   */
  private static incomePipeline(
    matchStage: Record<string, unknown>
  ): mongoose.PipelineStage[] {
    return [
      { $match: matchStage },
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
    ]
  }

  /**
   * Merges income groups (Payment) and expense groups (Profit) into paginated
   * month rows. `expenseGroups` is empty for a company scope - a company has
   * no costs of its own in this model, only invoices and payments - so every
   * month naturally comes out with expenses: 0.
   *
   * Pagination applies to MONTHS, not to individual records - slicing records
   * before grouping would make every month total a partial sum of whatever
   * landed on the current page.
   */
  private static buildLedgerResponse(
    incomeGroups: any[],
    expenseGroups: any[],
    page: number,
    limit: number
  ) {
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
          income: 0,
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
      // Kept out of `actual`: a hand-entered credit is not a client settling
      // an invoice. Folding it in inflated the collection rate, shrank
      // `outstanding`, and - on a company, where `actual` reads as money paid
      // out - filed income under an expense label.
      totals.income += g.manualIncome
      // One month can produce several expense groups (one per currency), so
      // append rather than overwrite.
      entry.transactions = [...entry.transactions, ...g.transactions]
      months.set(key, entry)
    }

    for (const entry of months.values()) {
      for (const totals of Object.values(entry.byCurrency)) {
        totals.outstanding = totals.expected - totals.actual
        totals.net = totals.actual + totals.income - totals.expenses
      }
      // Busiest currency first - that is the one worth reading at a glance.
      entry.currencies = Object.keys(entry.byCurrency).sort((a, b) => {
        const volume = (c: string) => {
          const t = entry.byCurrency[c]
          return (
            Math.abs(t.expected) +
            Math.abs(t.actual) +
            Math.abs(t.income) +
            Math.abs(t.expenses)
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

  private static expensePipeline(
    matchStage: Record<string, unknown>
  ): mongoose.PipelineStage[] {
    return [
      { $match: matchStage },
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
        // `periodMonth` says which month the cost belongs to; without it,
        // the month it was paid in.
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
    ]
  }

  /**
   * Monthly ledger for one scope - a domain or a company. The two are
   * symmetric on the Прибутки page: each gets its own expected/actual/
   * expenses/net, each can carry manual Profit records. The only thing that
   * differs is how an invoice reads -
   *   domain:  expected/actual are income   ("we billed them" / "they paid")
   *   company: expected/actual are expense  ("we were billed" / "we paid")
   * - a UI-layer label choice, not a data difference (see tableConfig.tsx's
   * ParentColumnsOptions and ProfitDashboard's `perspective` prop).
   *
   * expected/actual come from Payment (never mirrored into Profit, so the
   * two cannot drift apart); expenses come from manual Profit records
   * scoped the same way.
   *
   * `net` is the one figure that is NOT just a label swap, because `actual`
   * points opposite ways:
   *   domain:  actual is money collected  -> net = actual + income - expenses
   *   company: actual is money paid out   -> net = income - actual - expenses
   * `income` (hand-entered credits) is the one inflow a company has in this
   * billing model, so it is the term that can pull a company's net positive;
   * without it every company figure was an outflow and the page had no
   * profit on it at all.
   */
  private static async getLedgerFor(
    scopeField: 'domain' | 'company',
    id: string,
    page = 1,
    limit = 12
  ) {
    const match = { [scopeField]: new mongoose.Types.ObjectId(id) }

    const [incomeGroups, expenseGroups] = await Promise.all([
      Payment.aggregate(this.incomePipeline(match)),
      ProfitModel.aggregate(this.expensePipeline(match)),
    ])

    const ledger = await this.buildLedgerResponse(
      incomeGroups,
      expenseGroups,
      page,
      limit
    )

    if (scopeField === 'company') {
      for (const row of Object.values(ledger.data)) {
        for (const totals of Object.values(row.byCurrency)) {
          totals.net = totals.income - totals.actual - totals.expenses
        }
      }
    }

    return ledger
  }

  static getByDomainWithMonthSeparation(
    domainId: string,
    page = 1,
    limit = 12
  ) {
    return this.getLedgerFor('domain', domainId, page, limit)
  }

  static getByCompanyWithMonthSeparation(
    companyId: string,
    page = 1,
    limit = 12
  ) {
    return this.getLedgerFor('company', companyId, page, limit)
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
      domain: Types.ObjectId | string
      company: Types.ObjectId | string
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
