import { ObjectId } from 'mongoose'

export interface Profit {
  _id?: string
  domain: string | ObjectId
  amount: number
  type: 'debit' | 'credit'
  categories?: string[]
  description?: string
  /** Set when the record was generated from a Payment rather than by hand. */
  payment?: string
  invoiceNumber?: string
  date: string
  /** `YYYY-MM` the expense belongs to; falls back to the month of `date`. */
  periodMonth?: string
  /** ISO code; defaults to UAH on records created before multi-currency. */
  currency?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: {
    _id?: string
    name: string
    email: string
  }
}

export interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
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

/**
 * One month of a domain's ledger. Income comes from the Payment collection,
 * expenses from manual Profit records - see ProfitService.
 *
 * Every figure is per-currency: sums in different currencies are never added
 * together without an explicit rate, so there is no single "total".
 */
export interface ProfitMonthLedger {
  /** `YYYY-MM` */
  month: string
  /** Present in this month, busiest first. */
  currencies: string[]
  byCurrency: Record<string, CurrencyTotals>
  invoiceCount: number
  paymentCount: number
  transactions: Profit[]
}

/** A ledger month as the table renders it. */
export type ProfitMonthRow = ProfitMonthLedger & { key: string }

export interface GroupedProfitResponse {
  data: Record<string, ProfitMonthLedger>
  meta: Meta
}
