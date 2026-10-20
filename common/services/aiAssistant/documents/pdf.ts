import { columnRoles } from '@utils/debt-calculation/statement'
import type { DocumentKind, IStatementHeader } from './types'

/**
 * Reads a debt statement exported as PDF ("Інформація по місяцях").
 *
 * Unlike a photo, such a PDF carries its text with positions, so it is read
 * exactly and without any model: the column titles give each column's
 * horizontal position, and every figure goes to the column whose title is
 * nearest. A blank cell (no payment that month) is simply absent from the
 * text, which leaves it empty here - so the rows come out as the same
 * `cell|cell|…` lines the photo reader returns, and from there the import is
 * the photo import, card and all.
 */

/** One run of text on a page; `y` grows upwards, as PDF has it. */
export interface IPdfTextItem {
  str: string
  x: number
  y: number
  width: number
}

export interface IPdfStatement {
  documentType: DocumentKind
  /** False for a scan: a picture of a page, no text to read. */
  hasText: boolean
  header: IStatementHeader
  /** Column titles, left to right, as printed. */
  columns: string[]
  /** Rows per page, as `cell|cell|…` lines in column order. */
  pages: string[][]
}

/** Runs within this much of each other vertically are on one line. */
const LINE_TOLERANCE = 3

const PERIOD = /^\d{1,2}\s*[./]\s*\d{4}$/
const TOTALS = /^(всього|разом|итого|підсумок)/i

interface ILine {
  y: number
  items: IPdfTextItem[]
}

const center = (item: IPdfTextItem): number => item.x + item.width / 2

const toLines = (items: IPdfTextItem[]): ILine[] => {
  const lines: ILine[] = []
  for (const item of [...items].sort((a, b) => b.y - a.y)) {
    const line = lines.find(({ y }) => Math.abs(y - item.y) <= LINE_TOLERANCE)
    if (line) line.items.push(item)
    else lines.push({ y: item.y, items: [item] })
  }
  lines.forEach((line) => line.items.sort((a, b) => a.x - b.x))
  return lines
}

const lineText = (line: ILine): string =>
  line.items
    .map(({ str }) => str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

const isDataLine = (line: ILine): boolean =>
  PERIOD.test(line.items[0]?.str.trim() ?? '')

interface IColumn {
  title: string
  center: number
}

/**
 * The column titles above the first row. A title printed on two lines
 * («Вхідне / сальдо», «Нараху- / вання») is one column: its runs overlap
 * horizontally.
 */
const titleColumns = (titleLines: ILine[]): IColumn[] => {
  const clusters: { left: number; right: number; parts: IPdfTextItem[] }[] = []
  for (const line of titleLines) {
    for (const item of line.items) {
      const left = item.x
      const right = item.x + item.width
      const cluster = clusters.find(
        (other) => left < other.right && right > other.left
      )
      if (cluster) {
        cluster.parts.push(item)
        cluster.left = Math.min(cluster.left, left)
        cluster.right = Math.max(cluster.right, right)
      } else {
        clusters.push({ left, right, parts: [item] })
      }
    }
  }

  return clusters
    .sort((a, b) => a.left - b.left)
    .map(({ left, right, parts }) => ({
      // Top line first; a hyphen at a line end joins the word back.
      title: parts
        .sort((a, b) => b.y - a.y)
        .map(({ str }) => str.trim())
        .reduce((text, part) =>
          text.endsWith('-') ? text.slice(0, -1) + part : `${text} ${part}`
        ),
      center: (left + right) / 2,
    }))
}

/** A row's figures, each in the column whose title is nearest. */
const toCells = (line: ILine, columns: IColumn[]): string => {
  const cells = columns.map(() => [] as string[])
  for (const item of line.items) {
    const text = item.str.trim()
    if (!text) continue
    let nearest = 0
    columns.forEach((column, index) => {
      if (
        Math.abs(column.center - center(item)) <
        Math.abs(columns[nearest].center - center(item))
      ) {
        nearest = index
      }
    })
    cells[nearest].push(text)
  }
  return cells.map((parts) => parts.join(' ')).join('|')
}

const headerOf = (text: string): IStatementHeader => {
  const address = /адреса\s*:?\s*(.+)/i.exec(text)?.[1]?.trim() ?? null
  return {
    address,
    // No `\b`: in JS it does not see Cyrillic letters as word characters.
    apartment: /(?:^|[\s,])кв\.?\s*(\d+)/i.exec(address ?? '')?.[1] ?? null,
    ownerName:
      /(?:ПІБ|власник|абонент)\s*:?\s*([^\n]+)/i.exec(text)?.[1]?.trim() ??
      null,
    accountNumber:
      /(?:особовий\s+рахунок|о\/р|рахунок\s*№)\s*:?\s*([\d-]+)/i.exec(
        text
      )?.[1] ?? null,
  }
}

const EMPTY_HEADER: IStatementHeader = {
  address: null,
  apartment: null,
  ownerName: null,
  accountNumber: null,
}

/** Lays out the text of a statement's pages into its header, columns and rows. */
export function layoutStatement(pages: IPdfTextItem[][]): IPdfStatement {
  const nonBlank = pages.map((items) => items.filter(({ str }) => str.trim()))
  if (nonBlank.every((items) => items.length === 0)) {
    return {
      documentType: 'unknown',
      hasText: false,
      header: EMPTY_HEADER,
      columns: [],
      pages: [],
    }
  }

  let columns: IColumn[] = []
  let header: IStatementHeader = EMPTY_HEADER
  const rows: string[][] = []

  for (const items of nonBlank) {
    const lines = toLines(items)
    const firstData = lines.findIndex(isDataLine)
    if (firstData < 0) continue

    const above = lines.slice(0, firstData)
    if (!header.address) {
      header = headerOf(above.map(lineText).join('\n'))
    }
    // Title lines: between the header text and the first row. A page that
    // repeats no titles keeps the previous page's columns.
    const titles = titleColumns(
      above.filter((line) => !/адреса/i.test(lineText(line)))
    )
    if (titles.length >= 4) columns = titles

    if (columns.length === 0) continue
    rows.push(
      lines
        .slice(firstData)
        .filter(isDataLine)
        .filter((line) => !TOTALS.test(lineText(line)))
        .map((line) => toCells(line, columns))
    )
  }

  const titles = columns.map(({ title }) => title)
  const roles = columnRoles(titles)
  const isStatement =
    rows.some((page) => page.length > 0) &&
    ['period', 'opening', 'charged', 'closing'].every((role) =>
      roles.includes(role as (typeof roles)[number])
    )

  return {
    documentType: isStatement ? 'debtMonthlyStatement' : 'unknown',
    hasText: true,
    header,
    columns: titles,
    pages: isStatement ? rows : [],
  }
}

/** The text runs of every page of a PDF file. */
export async function readPdfText(data: Uint8Array): Promise<IPdfTextItem[][]> {
  const { getDocumentProxy } = await import('unpdf')
  const pdf = await getDocumentProxy(data)
  const pages: IPdfTextItem[][] = []
  for (let number = 1; number <= pdf.numPages; number += 1) {
    const page = await pdf.getPage(number)
    const { items } = await page.getTextContent()
    pages.push(
      items
        // Marked-content entries carry no text.
        .filter(
          (item): item is Extract<typeof item, { transform: number[] }> =>
            'transform' in item
        )
        .map((item) => ({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
        }))
    )
  }
  return pages
}

export async function readPdfStatement(
  data: Uint8Array
): Promise<IPdfStatement> {
  return layoutStatement(await readPdfText(data))
}
