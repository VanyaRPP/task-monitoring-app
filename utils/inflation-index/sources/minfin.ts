import type { IInflationIndexInput } from '@common/api/inflationIndexApi/inflationIndex.api.types'
import { HTMLElement, parse } from 'node-html-parser'
import { cellsOf, parseIndexCell } from './html'

export const MINFIN_SOURCE = 'minfin'
export const MINFIN_URL =
  'https://index.minfin.com.ua/ua/economy/index/inflation/'

const MONTH_HEADERS = [
  'Січ',
  'Лют',
  'Бер',
  'Кві',
  'Тра',
  'Чер',
  'Лип',
  'Сер',
  'Вер',
  'Жов',
  'Лис',
  'Гру',
]

const isSummaryTable = (table: HTMLElement): boolean => {
  const header = table.querySelector('tr')
  if (!header) return false
  const months = cellsOf(header).slice(1, 1 + MONTH_HEADERS.length)
  return months.join('|') === MONTH_HEADERS.join('|')
}

export function parseMinfin(html: string): IInflationIndexInput[] {
  const tables = parse(html).querySelectorAll('table').filter(isSummaryTable)
  if (tables.length !== 1) {
    throw new Error(
      `minfin: очікувалась одна зведена таблиця ІСЦ, знайдено ${tables.length}`
    )
  }

  const [, ...rows] = tables[0].querySelectorAll('tr')
  const items: IInflationIndexInput[] = []

  for (const row of rows) {
    const [yearText, ...monthCells] = cellsOf(row)

    if (!/^\d{4}$/.test(yearText) || monthCells.length < 12) {
      throw new Error(`minfin: нерозпізнаний рядок таблиці «${yearText}»`)
    }
    const year = Number(yearText)

    monthCells.slice(0, 12).forEach((text, i) => {
      const value = parseIndexCell(text, MINFIN_SOURCE, year, i + 1)
      if (value !== null) items.push({ year, month: i + 1, value })
    })
  }

  if (items.length === 0) {
    throw new Error('minfin: зведена таблиця ІСЦ порожня')
  }

  return items
}
