import { plusFloat } from '@utils/helpers'
import { splitProfitByCategory, type IProfitItem } from '@utils/profit-items'

/**
 * Category key: free-text custom categories ("Електрика", "електрика ")
 * must land in one group, so grouping ignores case and outer whitespace.
 */
export const normalizeCategoryKey = (name: string): string =>
  name.trim().toLocaleLowerCase('uk')

interface CategorizableRecord {
  amount: number
  date?: string
  categories?: string[]
  items?: IProfitItem[]
  currency?: string
}

/** One expense line - a receipt line, or a whole legacy record. */
export interface CategoryLine<T extends CategorizableRecord> {
  record: T
  /** Position inside `record.items`; absent for a legacy record. */
  itemIndex?: number
  amount: number
  description?: string
  /**
   * A legacy record with several categories but no per-line amounts: its
   * amount was split evenly, so this figure is an estimate.
   */
  approximate: boolean
}

export interface CategoryGroup<T extends CategorizableRecord> {
  /** `${normalized category}|${currency}` - unique per row. */
  key: string
  /** Display name: the first spelling met in the group. */
  category: string
  currency: string
  total: number
  /** 0..1 of all expenses in the same currency. */
  share: number
  lines: CategoryLine<T>[]
}

/**
 * Rolls expense records up by category. Currencies are never mixed: the same
 * category in two currencies makes two groups, and shares are computed
 * within one currency. Biggest group first, newest line first.
 */
export function groupProfitByCategory<T extends CategorizableRecord>(
  records: T[],
  uncategorized: string
): CategoryGroup<T>[] {
  const groups = new Map<string, CategoryGroup<T>>()
  const totals = new Map<string, number>()

  for (const record of records) {
    const currency = record.currency || 'UAH'
    const hasItems = !!record.items?.length
    const parts: { category: string; line: CategoryLine<T> }[] = hasItems
      ? record.items.map((item, itemIndex) => ({
          category: item.category || uncategorized,
          line: {
            record,
            itemIndex,
            amount: item.amount,
            description: item.description,
            approximate: false,
          },
        }))
      : splitProfitByCategory(record, uncategorized).map((part) => ({
          category: part.category,
          line: {
            record,
            amount: part.amount,
            approximate: (record.categories?.length ?? 0) > 1,
          },
        }))

    for (const { category, line } of parts) {
      const name = category.trim() || uncategorized
      const key = `${normalizeCategoryKey(name)}|${currency}`
      const group = groups.get(key) ?? {
        key,
        category: name,
        currency,
        total: 0,
        share: 0,
        lines: [],
      }
      group.total = plusFloat(group.total, line.amount)
      group.lines.push(line)
      groups.set(key, group)
      totals.set(currency, plusFloat(totals.get(currency) ?? 0, line.amount))
    }
  }

  const byDateDesc = (a: CategoryLine<T>, b: CategoryLine<T>) =>
    String(b.record.date ?? '').localeCompare(String(a.record.date ?? ''))

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      share: totals.get(group.currency)
        ? group.total / totals.get(group.currency)
        : 0,
      lines: [...group.lines].sort(byDateDesc),
    }))
    .sort((a, b) => b.total - a.total)
}
