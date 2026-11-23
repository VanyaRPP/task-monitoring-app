import { normalizeCurrency } from '@utils/helpers'
import { normalizeProfitItems } from '@utils/profit-items'
import type { CreateProfitInput } from './profit.service'

/**
 * Turns a request body into a Profit record to create, or says why it can't.
 * Shared by POST /api/profits and /api/profits/bulk, so a record is checked
 * the same way whichever door it comes in by. Ownership is NOT checked here -
 * see canAccessProfitTarget.
 */
export interface ParsedProfitBody {
  error?: string
  input?: Omit<CreateProfitInput, 'createdBy'>
}

export function parseProfitBody(body: unknown): ParsedProfitBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Expected a profit record object' }
  }

  const {
    domain,
    company,
    amount,
    type,
    description,
    date,
    categories,
    items,
    invoiceNumber,
    payment,
    periodMonth,
    currency,
  } = body as Record<string, any>

  // With items the record's amount and categories are theirs - never what
  // the client sent alongside.
  const lines = items === undefined ? null : normalizeProfitItems(items)
  if (lines && !lines.ok) return { error: lines.error }

  // Domain and company are symmetric scopes for a Profit record - exactly
  // one of them, matching whichever ledger the record is filed under (see
  // ProfitService.getLedgerFor).
  if ((!domain && !company) || !(lines || amount) || !type || !date) {
    return {
      error:
        'Missing required fields: domain or company, amount, type, or date',
    }
  }

  if (domain && company) {
    return { error: 'Provide either domain or company, not both' }
  }

  if (!['debit', 'credit'].includes(type)) {
    return { error: 'Invalid type. Allowed values: "debit" or "credit"' }
  }

  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) return { error: 'Invalid date' }

  return {
    input: {
      ...(company ? { company } : { domain }),
      amount: lines ? lines.amount : Number(amount),
      type,
      date: parsedDate,
      description: typeof description === 'string' ? description.trim() : '',
      categories: lines
        ? lines.categories
        : Array.isArray(categories)
          ? categories
          : [],
      ...(lines ? { items: lines.items } : {}),
      invoiceNumber:
        typeof invoiceNumber === 'string' ? invoiceNumber.trim() : undefined,
      payment,
      // Optional: the ledger falls back to the month of `date` without it.
      periodMonth: /^\d{4}-\d{2}$/.test(periodMonth ?? '')
        ? periodMonth
        : undefined,
      currency: normalizeCurrency(currency),
    },
  }
}

/** Fields a PATCH may change. Anything else (createdBy, payment, ...) is dropped. */
const PATCHABLE = [
  'amount',
  'type',
  'categories',
  'description',
  'date',
  'periodMonth',
  'currency',
] as const

export interface ParsedProfitPatch {
  error?: string
  update?: Record<string, any> & { domain?: string; company?: string }
  /** The scope field the record leaves when it moves to the other one. */
  unset?: ('domain' | 'company')[]
}

/**
 * Turns a PATCH body into an update: only known fields, items re-derived into
 * amount/categories, and a move between ledgers kept to exactly one scope.
 */
export function parseProfitPatch(body: unknown): ParsedProfitPatch {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Expected an object of fields to update' }
  }
  const raw = body as Record<string, any>

  const update: ParsedProfitPatch['update'] = {}
  for (const field of PATCHABLE) {
    if (raw[field] !== undefined) update[field] = raw[field]
  }

  if (update.type !== undefined && !['debit', 'credit'].includes(update.type)) {
    return { error: 'Invalid type. Allowed values: "debit" or "credit"' }
  }
  if (update.date !== undefined && isNaN(new Date(update.date).getTime())) {
    return { error: 'Invalid date' }
  }

  if (raw.items !== undefined) {
    const lines = normalizeProfitItems(raw.items)
    if (!lines.ok) return { error: lines.error }
    update.items = lines.items
    update.amount = lines.amount
    update.categories = lines.categories
  }

  if (raw.domain && raw.company) {
    return { error: 'Provide either domain or company, not both' }
  }
  if (raw.domain) {
    update.domain = String(raw.domain)
    return { update, unset: ['company'] }
  }
  if (raw.company) {
    update.company = String(raw.company)
    return { update, unset: ['domain'] }
  }

  return { update, unset: [] }
}
