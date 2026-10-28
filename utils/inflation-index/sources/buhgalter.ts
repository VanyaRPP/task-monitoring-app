import type { IInflationIndexInput } from '@common/api/inflationIndexApi/inflationIndex.api.types'
import { periodKey } from '@utils/debt-calculation/months'
import { HTMLElement, parse } from 'node-html-parser'
import { cellsOf, parseIndexCell } from './html'

export const BUHGALTER_SOURCE = 'buhgalter'
export const BUHGALTER_URL =
  'https://buhgalter.com.ua/dovidnik/norma-robochogo-chasu/tablitsya-indeksiv-inflyatsiyi/'

const MONTH_NAMES = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
]

const YEAR_PATTERN = /^\d{4}$/

const isIndexTable = (table: HTMLElement): boolean => {
  const header = table.querySelector('tr')
  if (!header) return false
  const [corner, ...years] = cellsOf(header)
  return (
    corner === '' &&
    years.length > 0 &&
    years.every((y) => YEAR_PATTERN.test(y))
  )
}

export function parseBuhgalter(html: string): IInflationIndexInput[] {
  const tables = parse(html).querySelectorAll('table').filter(isIndexTable)
  if (tables.length !== 1) {
    throw new Error(
      `buhgalter: очікувалась одна таблиця ІСЦ, знайдено ${tables.length}`
    )
  }

  const [header, ...rows] = tables[0].querySelectorAll('tr')
  const years = cellsOf(header).slice(1).map(Number)
  const seenMonths = new Set<number>()
  const items: IInflationIndexInput[] = []

  for (const row of rows) {
    const [label, ...cells] = cellsOf(row)
    const month = MONTH_NAMES.indexOf(label) + 1
    if (month === 0) continue

    if (seenMonths.has(month)) {
      throw new Error(`buhgalter: місяць «${label}» трапився двічі`)
    }
    seenMonths.add(month)

    if (cells.length !== years.length) {
      throw new Error(
        `buhgalter: у рядку «${label}» ${cells.length} клітинок на ${years.length} років`
      )
    }

    cells.forEach((text, i) => {
      const value = parseIndexCell(text, BUHGALTER_SOURCE, years[i], month)
      if (value !== null) items.push({ year: years[i], month, value })
    })
  }

  if (seenMonths.size !== MONTH_NAMES.length) {
    throw new Error(
      `buhgalter: знайдено ${seenMonths.size} з ${MONTH_NAMES.length} місяців`
    )
  }
  if (items.length === 0) {
    throw new Error('buhgalter: таблиця ІСЦ порожня')
  }

  return items.sort((a, b) => periodKey(a) - periodKey(b))
}
