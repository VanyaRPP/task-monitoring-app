import {
  IYearMonth,
  parsePeriod,
  periodKey,
} from '@utils/debt-calculation/months'
import type { IStatementIssue } from '@utils/debt-calculation/statement'

/**
 * How a photo is cut into horizontal strips for reading.
 *
 * Groq's free tier writes ~1000 output tokens a minute; a statement row with
 * five-digit balances costs ~45 of them, so one strip may hold ~20 rows at
 * most. Strips are planned for fewer, because the table rarely fills the whole
 * photo height evenly, and they overlap so a row cut by one edge is whole in
 * the neighbour - the merge keeps the copy that balances.
 *
 * Fractions of the photo height, so the same plan works at any resolution.
 */
export interface IStrip {
  top: number
  bottom: number
}

export const ROWS_PER_STRIP = 14
export const STRIP_OVERLAP = 0.05
/** Below this a strip holds a couple of rows at most; splitting further is pointless. */
export const MIN_STRIP_HEIGHT = 0.08

const clamp = (value: number): number => Math.min(1, Math.max(0, value))

export const planStrips = (rowCount: number): IStrip[] => {
  const count = Math.max(1, Math.ceil(rowCount / ROWS_PER_STRIP))
  const step = 1 / count

  return Array.from({ length: count }, (_, index) => ({
    top: clamp(index * step - STRIP_OVERLAP),
    bottom: clamp((index + 1) * step + STRIP_OVERLAP),
  }))
}

/** Half-height of a targeted re-read strip: about three rows either way. */
export const REREAD_HALF_HEIGHT = 0.07

/** A strip that was read, and which months (period keys) it returned, top to bottom. */
export interface IReadStrip {
  strip: IStrip
  periods: number[]
}

/**
 * Where on the photo each month sits, estimated from the strips: a strip's
 * rows are spread evenly over its height. Rough - but a re-read strip is a
 * few rows tall, which absorbs the error.
 */
const anchorsOf = (reads: IReadStrip[]): Map<number, number> => {
  const sums = new Map<number, { total: number; count: number }>()

  for (const { strip, periods } of reads) {
    periods.forEach((period, index) => {
      const y =
        strip.top +
        ((index + 0.5) / periods.length) * (strip.bottom - strip.top)
      const sum = sums.get(period) ?? { total: 0, count: 0 }
      sums.set(period, { total: sum.total + y, count: sum.count + 1 })
    })
  }

  return new Map(
    [...sums].map(([period, { total, count }]) => [period, total / count])
  )
}

const locate = (
  anchors: Map<number, number>,
  period: number
): number | null => {
  if (anchors.has(period)) return anchors.get(period)
  const keys = [...anchors.keys()].sort((a, b) => a - b)
  const below = keys.filter((key) => key < period).pop()
  const above = keys.find((key) => key > period)

  if (below === undefined && above === undefined) return null
  if (below === undefined) return anchors.get(above)
  if (above === undefined) return anchors.get(below)

  const share = (period - below) / (above - below)
  return anchors.get(below) + share * (anchors.get(above) - anchors.get(below))
}

/**
 * Narrow strips centred on the months that went missing or do not add up -
 * typically rows cut by a strip edge. Suspects close together share a strip.
 */
export const planRereads = (
  reads: IReadStrip[],
  suspects: number[]
): IStrip[] => {
  const anchors = anchorsOf(reads)
  const centres = [...new Set(suspects)]
    .map((period) => locate(anchors, period))
    .filter((y): y is number => y !== null)
    .sort((a, b) => a - b)

  const strips: IStrip[] = []
  for (const y of centres) {
    const last = strips[strips.length - 1]
    if (last && y - REREAD_HALF_HEIGHT <= last.bottom - REREAD_HALF_HEIGHT) {
      last.bottom = clamp(y + REREAD_HALF_HEIGHT)
      continue
    }
    strips.push({
      top: clamp(y - REREAD_HALF_HEIGHT),
      bottom: clamp(y + REREAD_HALF_HEIGHT),
    })
  }

  return strips
}

/**
 * Halves a strip that held too many rows for one answer. `null` when it is
 * already too thin to split.
 */
export const splitStrip = ({ top, bottom }: IStrip): IStrip[] | null => {
  if (bottom - top < MIN_STRIP_HEIGHT * 2) return null

  const middle = (top + bottom) / 2

  return [
    { top, bottom: clamp(middle + STRIP_OVERLAP / 2) },
    { top: clamp(middle - STRIP_OVERLAP / 2), bottom },
  ]
}

/**
 * Months worth another look after a pass: rows that do not add up, months
 * missing between two read ones, and the rows on either side of a gap (a
 * strip edge that swallowed a row often garbled its neighbours too).
 */
export const suspectPeriods = (
  rows: IYearMonth[],
  issues: Pick<IStatementIssue, 'kind' | 'period'>[]
): number[] => {
  const keys = rows.map(periodKey)
  const suspects = new Set<number>()

  for (const { kind, period } of issues) {
    const parsed = period ? parsePeriod(period) : null
    if (!parsed || (kind !== 'arithmetic' && kind !== 'gap')) continue

    const key = periodKey(parsed)
    suspects.add(key)
    if (kind !== 'gap') continue

    const before = keys.filter((other) => other < key).pop()
    if (before === undefined) continue
    suspects.add(before)
    for (let missing = before + 1; missing < key; missing += 1) {
      suspects.add(missing)
    }
  }

  return [...suspects].sort((a, b) => a - b)
}
