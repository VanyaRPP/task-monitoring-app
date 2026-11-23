import type { IPdfTextItem } from './pdf'

/**
 * Text runs of a statement PDF, laid out like the HOA's "Інформація по
 * місяцях" export: titles on two lines, figures right-aligned in their
 * columns, a blank payment cell simply absent. Positions are taken from a real
 * export; the data is whatever a test passes in. Test-only.
 */

const CHAR_WIDTH = 5.5
const ROW_HEIGHT = 15.7

// Right edges of the figure columns, and where the month starts.
const PERIOD_X = 33.1
const RIGHT_EDGE = {
  opening: 118.3,
  correction: 167.1,
  charged: 215.8,
  bank: 265.5,
  payment: 313.3,
  subsidy: 358.3,
  closing: 403.3,
} as const

export type FixtureColumn = keyof typeof RIGHT_EDGE

const TITLES: [string, number, number][] = [
  // text, x, width - on the upper title line unless noted below
  ['М/Рік', 36.2, 24.2],
  ['Вхідне', 81.4, 30.5],
  ['Коректура', 119.6, 47.1],
  ['Нараху-', 173.4, 36.8],
  ['Ел. банк', 221.3, 38.8],
  ['Оплата', 272.3, 34.2],
  ['Субсидія', 315.5, 41.5],
  ['Вихідне', 363.1, 36.2],
]
const LOWER_TITLES: [string, number, number][] = [
  ['сальдо', 80.2, 32.8],
  ['вання', 178.3, 27.1],
  ['сальдо', 364.8, 32.8],
]

export type FixtureRow = { period: string } & Partial<
  Record<FixtureColumn, string>
>

const item = (str: string, x: number, y: number): IPdfTextItem => ({
  str,
  x,
  y,
  width: str.length * CHAR_WIDTH,
})

const rightAligned = (str: string, column: FixtureColumn, y: number) =>
  item(str, RIGHT_EDGE[column] - str.length * CHAR_WIDTH, y)

/** One page: the address, the titles (unless `titles: false`), the rows, maybe a totals line. */
export function statementPage(
  address: string,
  rows: FixtureRow[],
  {
    titles = true,
    totals,
  }: { titles?: boolean; totals?: Partial<Record<FixtureColumn, string>> } = {}
): IPdfTextItem[] {
  const items: IPdfTextItem[] = [item(`Адреса: ${address}`, 18.7, 793.2)]
  if (titles) {
    TITLES.forEach(([str, x, width]) => items.push({ str, x, y: 773.6, width }))
    LOWER_TITLES.forEach(([str, x, width]) =>
      items.push({ str, x, y: 762.6, width })
    )
  }

  let y = 745.8
  for (const { period, ...cells } of rows) {
    items.push(item(period, PERIOD_X, y))
    for (const [column, value] of Object.entries(cells)) {
      if (value) items.push(rightAligned(value, column as FixtureColumn, y))
    }
    y -= ROW_HEIGHT
  }

  if (totals) {
    items.push(item('Всього:', 78.4, y + 0.4))
    for (const [column, value] of Object.entries(totals)) {
      items.push(rightAligned(value, column as FixtureColumn, y))
    }
  }
  return items
}
