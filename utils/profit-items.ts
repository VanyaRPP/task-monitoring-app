import { plusFloat, toRoundFixed } from '@utils/helpers'

/**
 * Line items of a hand-entered Profit record: one receipt, several
 * categories, each with its own amount. Shared by the API (which derives the
 * record's `amount` from them), the add-cost form and the AI assistant, so
 * all three agree on the rules. Client-safe: no server-only imports.
 */

/** Offered in the category picker; anything else is a custom («Інше») name. */
export const PROFIT_DEFAULT_CATEGORIES = [
  'Оренда',
  'Електрика',
  'Вода',
  'Обслуговування',
  'Прибирання',
  'Майстри',
  'Матеріали',
  'Кава-чай',
] as const

export const PROFIT_ITEM_CATEGORY_MAX = 60
export const PROFIT_ITEM_DESCRIPTION_MAX = 120
export const PROFIT_ITEMS_MAX = 50

export interface IProfitItem {
  /** Empty when the line has no category - shown as «Без категорії». */
  category?: string
  /** Always positive; the record's `type` carries the sign. */
  amount: number
  description?: string
}

// Flat rather than a union on `ok`: with `strict: false` TypeScript does not
// narrow a boolean discriminant, so callers check `ok` and read the rest.
export interface NormalizeProfitItemsResult {
  ok: boolean
  /** Why the lines were rejected; set only when `ok` is false. */
  error?: string
  items?: IProfitItem[]
  /** Σ items, rounded to kopecks. */
  amount?: number
  /** Distinct non-empty categories, in item order. */
  categories?: string[]
}

/** Σ of item amounts, rounded to 2 decimals (big.js inside). */
export function sumProfitItems(items: Pick<IProfitItem, 'amount'>[]): number {
  return items.reduce(
    (total, item) =>
      Number.isFinite(Number(item?.amount))
        ? plusFloat(total, item.amount)
        : total,
    0
  )
}

/**
 * Validates raw items (from a request body) and derives the record's
 * `amount` and `categories` from them. A record's amount is never taken from
 * the client when it has items - it is always their sum.
 */
export function normalizeProfitItems(raw: unknown): NormalizeProfitItemsResult {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: 'items must be a non-empty array' }
  }
  if (raw.length > PROFIT_ITEMS_MAX) {
    return { ok: false, error: `items: at most ${PROFIT_ITEMS_MAX} lines` }
  }

  const items: IProfitItem[] = []
  for (const [index, line] of raw.entries()) {
    const amount = Number(line?.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        ok: false,
        error: `items[${index}].amount must be a positive number`,
      }
    }

    const category =
      typeof line?.category === 'string'
        ? line.category.trim().slice(0, PROFIT_ITEM_CATEGORY_MAX)
        : ''
    const description =
      typeof line?.description === 'string'
        ? line.description.trim().slice(0, PROFIT_ITEM_DESCRIPTION_MAX)
        : ''

    items.push({
      ...(category ? { category } : {}),
      amount: Number(toRoundFixed(amount)),
      ...(description ? { description } : {}),
    })
  }

  return {
    ok: true,
    items,
    amount: sumProfitItems(items),
    categories: Array.from(
      new Set(items.map(({ category }) => category).filter(Boolean))
    ),
  }
}

/**
 * How a record splits across categories, for the expense breakdown: by its
 * items when it has them, otherwise (older records) evenly across its
 * categories so the parts still add up to the record's amount.
 */
export function splitProfitByCategory(
  record: { amount: number; categories?: string[]; items?: IProfitItem[] },
  uncategorized: string
): { category: string; amount: number }[] {
  if (record.items?.length) {
    return record.items.map((item) => ({
      category: item.category || uncategorized,
      amount: item.amount,
    }))
  }

  const categories = record.categories?.length
    ? record.categories
    : [uncategorized]
  const share = record.amount / categories.length
  return categories.map((category) => ({ category, amount: share }))
}

/**
 * Lines to edit for an existing record. Older records have no items: a
 * single category takes the whole amount, several get empty amounts for the
 * user to split (there is no right way to guess the split).
 */
export function itemsForEditing(record: {
  amount: number
  categories?: string[]
  items?: IProfitItem[]
}): Partial<IProfitItem>[] {
  if (record.items?.length) return record.items.map((item) => ({ ...item }))

  const categories = record.categories ?? []
  if (categories.length > 1) return categories.map((category) => ({ category }))

  return [
    {
      ...(categories[0] ? { category: categories[0] } : {}),
      amount: record.amount,
    },
  ]
}
