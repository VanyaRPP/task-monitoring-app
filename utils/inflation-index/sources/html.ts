import type { HTMLElement } from 'node-html-parser'

const VALUE_PATTERN = /^\d{2,3}(?:[.,]\d+)?$/

export const cellsOf = (row: HTMLElement): string[] =>
  row.querySelectorAll('th, td').map((cell) => cell.text.trim())

export function parseIndexCell(
  text: string,
  source: string,
  year: number,
  month: number
): number | null {
  if (text === '') return null
  if (!VALUE_PATTERN.test(text)) {
    throw new Error(
      `${source}: нерозпізнане значення «${text}» за ${year}-${month}`
    )
  }
  return Number(text.replace(',', '.'))
}
