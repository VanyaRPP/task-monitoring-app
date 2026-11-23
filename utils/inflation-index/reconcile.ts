import type { IInflationIndexInput } from '@common/api/inflationIndexApi/inflationIndex.api.types'
import { periodKey } from '@utils/debt-calculation/months'
import type {
  IIndexMismatch,
  IIndexRejected,
  IIndexSource,
  ISourceValue,
} from './types'

export const MIN_SOURCES = 2

export const INDEX_RANGE = { min: 90, max: 120 }

const toTenths = (value: number): number => Math.round(value * 10)

export function reconcileSources(sources: IIndexSource[]): {
  agreed: IInflationIndexInput[]
  mismatched: IIndexMismatch[]
} {
  const byMonth = new Map<
    number,
    { year: number; month: number; values: ISourceValue[] }
  >()

  for (const { name, items } of sources) {
    for (const { year, month, value } of items) {
      const key = periodKey({ year, month })
      const entry = byMonth.get(key) ?? { year, month, values: [] }
      entry.values.push({ source: name, value })
      byMonth.set(key, entry)
    }
  }

  const agreed: IInflationIndexInput[] = []
  const mismatched: IIndexMismatch[] = []

  const months = [...byMonth.entries()].sort(([a], [b]) => a - b)
  for (const [, { year, month, values }] of months) {
    const distinctValues = new Set(values.map(({ value }) => toTenths(value)))
    const distinctSources = new Set(values.map(({ source }) => source))

    if (distinctValues.size > 1) {
      mismatched.push({ year, month, reason: 'conflict', values })
    } else if (distinctSources.size < MIN_SOURCES) {
      mismatched.push({ year, month, reason: 'unconfirmed', values })
    } else {
      agreed.push({ year, month, value: toTenths(values[0].value) / 10 })
    }
  }

  return { agreed, mismatched }
}

export function filterByRange(items: IInflationIndexInput[]): {
  valid: IInflationIndexInput[]
  rejected: IIndexRejected[]
} {
  const valid: IInflationIndexInput[] = []
  const rejected: IIndexRejected[] = []

  for (const item of items) {
    const { value } = item
    if (
      Number.isFinite(value) &&
      value >= INDEX_RANGE.min &&
      value <= INDEX_RANGE.max
    ) {
      valid.push(item)
    } else {
      rejected.push(item)
    }
  }

  return { valid, rejected }
}
