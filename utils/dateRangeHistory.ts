import { cascaderMonths } from '@utils/constants'
import {
  DATE_RANGE_FORMAT,
  PaymentDateRange,
  parseDateRange,
} from '@utils/paymentDateRange'
import dayjs from 'dayjs'

export const DATE_RANGE_HISTORY_STORAGE_KEY = 'payments_date_range_history'
export const DATE_RANGE_HISTORY_LIMIT = 6
export const GLOBAL_HISTORY_SCOPE = 'global'

/** One applied range; `from`/`to` are `YYYY-MM-DD`, `usedAt` is epoch ms. */
export interface DateHistoryItem {
  from: string
  to: string
  usedAt: number
}

export interface DateRangeHistoryStore {
  version: 1
  scopes: Record<string, DateHistoryItem[]>
}

export const emptyDateRangeHistory = (): DateRangeHistoryStore => ({
  version: 1,
  scopes: {},
})

const normaliseIds = (ids: unknown): string[] =>
  Array.isArray(ids)
    ? Array.from(new Set(ids.filter(Boolean).map(String))).sort()
    : []

/**
 * History key for the active filter context: company beats domain beats
 * global. A combination is its own scope; ids are sorted so selection order
 * does not matter.
 */
export function getDateRangeHistoryScope(filters?: {
  company?: unknown
  domain?: unknown
}): string {
  const companyIds = normaliseIds(filters?.company)
  if (companyIds.length) return `company:${companyIds.join(',')}`

  const domainIds = normaliseIds(filters?.domain)
  if (domainIds.length) return `domain:${domainIds.join(',')}`

  return GLOBAL_HISTORY_SCOPE
}

/**
 * Puts `range` at the top of `scope`, dropping an equal older entry and
 * trimming to the limit. Returns a new store.
 */
export function addDateRangeToHistory(
  store: DateRangeHistoryStore,
  scope: string,
  range: PaymentDateRange,
  usedAt: number = Date.now(),
  limit: number = DATE_RANGE_HISTORY_LIMIT
): DateRangeHistoryStore {
  const parsed = parseDateRange(range.dateFrom, range.dateTo)
  if (!parsed) return store

  const item: DateHistoryItem = {
    from: parsed.dateFrom,
    to: parsed.dateTo,
    usedAt,
  }
  const rest = (store.scopes[scope] ?? []).filter(
    (entry) => entry.from !== item.from || entry.to !== item.to
  )
  return {
    ...store,
    scopes: { ...store.scopes, [scope]: [item, ...rest].slice(0, limit) },
  }
}

export function getDateRangeHistory(
  store: DateRangeHistoryStore,
  scope: string
): DateHistoryItem[] {
  return store.scopes[scope] ?? []
}

const isHistoryItem = (value: unknown): value is DateHistoryItem => {
  const item = value as DateHistoryItem
  return (
    !!item &&
    typeof item.usedAt === 'number' &&
    !!parseDateRange(item.from, item.to)
  )
}

/** Parses stored JSON, keeping only well-formed entries. Never throws. */
export function parseDateRangeHistory(
  raw: string | null | undefined
): DateRangeHistoryStore {
  if (!raw) return emptyDateRangeHistory()
  try {
    const data = JSON.parse(raw)
    if (data?.version !== 1 || typeof data.scopes !== 'object') {
      return emptyDateRangeHistory()
    }
    const scopes: Record<string, DateHistoryItem[]> = {}
    for (const [scope, items] of Object.entries(data.scopes ?? {})) {
      if (!Array.isArray(items)) continue
      const valid = items.filter(isHistoryItem)
      if (valid.length) scopes[scope] = valid.slice(0, DATE_RANGE_HISTORY_LIMIT)
    }
    return { version: 1, scopes }
  } catch {
    return emptyDateRangeHistory()
  }
}

export function readDateRangeHistory(): DateRangeHistoryStore {
  try {
    return parseDateRangeHistory(
      window.localStorage.getItem(DATE_RANGE_HISTORY_STORAGE_KEY)
    )
  } catch {
    return emptyDateRangeHistory()
  }
}

export function writeDateRangeHistory(store: DateRangeHistoryStore): void {
  try {
    window.localStorage.setItem(
      DATE_RANGE_HISTORY_STORAGE_KEY,
      JSON.stringify(store)
    )
  } catch (error) {
    // Quota exceeded / storage disabled: history is a convenience, not data.
    console.warn('Could not save date range history', error)
  }
}

const monthName = (month: number) => cascaderMonths[month].label

/**
 * Short label: a whole year → "2025 рік", a whole month → "Серпень 2026",
 * anything else → "01.08.2026 — 28.09.2026".
 */
export function formatDateRangeHistoryLabel(item: {
  from: string
  to: string
}): string {
  const from = dayjs(item.from, DATE_RANGE_FORMAT, true)
  const to = dayjs(item.to, DATE_RANGE_FORMAT, true)

  if (
    from.isSame(from.startOf('year'), 'day') &&
    to.isSame(from.endOf('year'), 'day')
  ) {
    return `${from.year()} рік`
  }
  if (
    from.isSame(from.startOf('month'), 'day') &&
    to.isSame(from.endOf('month'), 'day')
  ) {
    return `${monthName(from.month())} ${from.year()}`
  }
  return `${from.format('DD.MM.YYYY')} — ${to.format('DD.MM.YYYY')}`
}
