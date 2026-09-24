import { cascaderMonths } from '@utils/constants'
import { formatPeriod, IYearMonth } from '@utils/debt-calculation/months'
import {
  IDebtCalculationResult,
  InflationMethod,
} from '@utils/debt-calculation/types'

export interface IDebtExcelInput {
  companyName: string
  description?: string
  domainName?: string
  result: IDebtCalculationResult
  from?: IYearMonth
  to?: IYearMonth
  annualRatePercent: number
  inflationMethod: InflationMethod
  /** Area and tariff as they stand in the page header. */
  area?: number
  tariff?: number
  openingDebt?: number
  generatedAt?: Date
}

export type CellAlign = 'left' | 'center' | 'right'

export interface IExcelCell {
  v: string | number
  bold?: boolean
  align?: CellAlign
  /** Border around the cell. */
  border?: boolean
  /** Fill - table header and total rows. */
  fill?: 'head' | 'total'
  /** How many columns to span, this one included. */
  span?: number
  /** Number format, e.g. `0.00`. */
  numFmt?: string
}

export interface IDebtExcelDocument {
  rows: (IExcelCell | null)[][]
  columns: { wch: number }[]
  sheetName: string
}

export const SHEET_NAME = 'Розрахунок'

const THIN = { style: 'thin', color: { rgb: '9E9E9E' } }
const FILL: Record<NonNullable<IExcelCell['fill']>, string> = {
  head: 'DDE5F0',
  total: 'F0F0F0',
}

/**
 * Translates the cell flags into an `xlsx-js-style` style object.
 *
 * Lives here beside the document rather than in the hook, so the export and
 * the round-trip test share one conversion instead of two similar ones.
 */
export const toXlsxStyle = (cell: IExcelCell): Record<string, unknown> => ({
  font: { name: 'Calibri', sz: 11, bold: !!cell.bold },
  alignment: {
    horizontal: cell.align ?? 'left',
    vertical: 'center',
  },
  ...(cell.border
    ? { border: { top: THIN, bottom: THIN, left: THIN, right: THIN } }
    : {}),
  ...(cell.fill ? { fill: { fgColor: { rgb: FILL[cell.fill] } } } : {}),
})

/** Column widths: the first fits month names, the rest fit numbers. */
const COLUMN_WIDTHS = [18, 13, 13, 11, 14, 12, 14, 8, 13, 12, 14]
const COLUMN_COUNT = COLUMN_WIDTHS.length

const MONEY = '0.00'
const COEFFICIENT = '0.000000'

const METHOD_LABEL: Record<InflationMethod, string> = {
  balance: 'За залишком боргу (як у паперовому Акті)',
  monthly: 'Помісячний (ст. 625 ЦК)',
}

const TABLE_HEAD = [
  'Місяць',
  'Сплачено',
  'Нараховано',
  'Площа, м²',
  'Тариф, грн/м²',
  'Річних',
  'Сума боргу',
  'Днів',
  'Індекс інфляції, %',
  'Коефіцієнт',
  'Інфляційні',
]

const money = (value?: number): number =>
  Number.isFinite(value) ? +(value as number).toFixed(2) : 0

const monthLabel = ({ year, month }: IYearMonth): string =>
  `${cascaderMonths[month - 1]?.label ?? month} ${year}`

const periodLabel = (value?: IYearMonth): string =>
  value ? formatPeriod(value) : '—'

/** `2026-09-23T14:32:00Z` → `23.09.2026 14:32`; empty when there is no stamp. */
const timestampLabel = (value?: string): string => {
  if (!value) return ''

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? ''
    : `${String(date.getDate()).padStart(2, '0')}.${String(
        date.getMonth() + 1
      ).padStart(2, '0')}.${date.getFullYear()} ${String(
        date.getHours()
      ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const row = (...cells: (IExcelCell | null)[]): (IExcelCell | null)[] => cells
const blank = (): (IExcelCell | null)[] => []

const label = (text: string, span = 3): IExcelCell => ({
  v: text,
  span,
  bold: true,
})

const value = (text: string | number, span = 5): IExcelCell => ({
  v: text,
  span,
})

/**
 * The date the debt is stated as of: the first day of the month FOLLOWING the
 * end of the period. A period through June 2025 → debt as of 01.07.2025.
 */
export const asOfLabel = (to?: IYearMonth): string => {
  if (!to) return '—'

  const year = to.month === 12 ? to.year + 1 : to.year
  const month = to.month === 12 ? 1 : to.month + 1

  return `01.${String(month).padStart(2, '0')}.${year}`
}

/**
 * Assembles the whole document the way the page shows it: a parameter header,
 * the monthly table, and a summary block styled after the paper Act.
 *
 * Pure: no `xlsx` here. Styling is expressed as flags, and `useExportExcel`
 * turns them into real borders and fills in the browser.
 */
export const buildDebtCalculationDocument = ({
  companyName,
  description,
  domainName,
  result,
  from,
  to,
  annualRatePercent,
  inflationMethod,
  area,
  tariff,
  openingDebt,
  generatedAt = new Date(),
}: IDebtExcelInput): IDebtExcelDocument => {
  const interestLabel = `${annualRatePercent}% річних`

  const head: (IExcelCell | null)[][] = [
    row({ v: 'Розрахунок заборгованості', bold: true, span: COLUMN_COUNT }),
    blank(),
    row(label('Надавач послуг'), value(domainName ?? '—')),
    row(label('Компанія'), value(companyName)),
    ...(description ? [row(label('Опис'), value(description))] : []),
    row(label('Період'), value(`${periodLabel(from)} — ${periodLabel(to)}`)),
    row(label('Загальна площа, м²'), value(money(area))),
    row(label('Тариф, грн за 1 м²'), value(money(tariff))),
    row(label('Борг на початок періоду'), value(money(openingDebt))),
    row(label('Ставка річних, %'), value(annualRatePercent)),
    row(label('Метод інфляційних'), value(METHOD_LABEL[inflationMethod])),
    blank(),
  ]

  const table: (IExcelCell | null)[][] = [
    row(
      ...TABLE_HEAD.map<IExcelCell>((title) => ({
        v: title,
        bold: true,
        border: true,
        fill: 'head',
        align: 'center',
      }))
    ),
    ...result.rows.map((month) =>
      row(
        { v: monthLabel(month), border: true },
        { v: money(month.paid), border: true, numFmt: MONEY, align: 'right' },
        {
          v: money(month.charged),
          border: true,
          numFmt: MONEY,
          align: 'right',
        },
        { v: money(month.area), border: true, numFmt: MONEY, align: 'right' },
        { v: money(month.tariff), border: true, numFmt: MONEY, align: 'right' },
        {
          v: money(month.interest),
          border: true,
          numFmt: MONEY,
          align: 'right',
        },
        {
          v: money(month.debt),
          border: true,
          numFmt: MONEY,
          align: 'right',
          bold: true,
        },
        { v: month.days, border: true, align: 'right' },
        {
          v: money(month.inflationIndex),
          border: true,
          numFmt: MONEY,
          align: 'right',
        },
        {
          v: +month.coefficient.toFixed(6),
          border: true,
          numFmt: COEFFICIENT,
          align: 'right',
        },
        {
          v: money(month.inflationLoss),
          border: true,
          numFmt: MONEY,
          align: 'right',
        }
      )
    ),
    row(
      { v: 'Всього', bold: true, border: true, fill: 'total' },
      {
        v: money(result.totals.paid),
        bold: true,
        border: true,
        fill: 'total',
        numFmt: MONEY,
        align: 'right',
      },
      {
        v: money(result.totals.charged),
        bold: true,
        border: true,
        fill: 'total',
        numFmt: MONEY,
        align: 'right',
      },
      { v: '', border: true, fill: 'total' },
      { v: '', border: true, fill: 'total' },
      {
        v: money(result.interest),
        bold: true,
        border: true,
        fill: 'total',
        numFmt: MONEY,
        align: 'right',
      },
      {
        v: money(result.body),
        bold: true,
        border: true,
        fill: 'total',
        numFmt: MONEY,
        align: 'right',
      },
      {
        v: result.totals.days,
        bold: true,
        border: true,
        fill: 'total',
        align: 'right',
      },
      { v: '', border: true, fill: 'total' },
      {
        v: +result.coefficient.toFixed(6),
        bold: true,
        border: true,
        fill: 'total',
        numFmt: COEFFICIENT,
        align: 'right',
      },
      {
        v: money(result.inflation),
        bold: true,
        border: true,
        fill: 'total',
        numFmt: MONEY,
        align: 'right',
      }
    ),
  ]

  const actRow = (
    text: string,
    amount: number,
    bold = false
  ): (IExcelCell | null)[] =>
    row(
      { v: text, span: 5, bold, border: true },
      null,
      null,
      null,
      null,
      {
        v: money(amount),
        span: 2,
        bold,
        border: true,
        numFmt: MONEY,
        align: 'right',
      },
      null,
      { v: 'грн', border: true }
    )

  const act: (IExcelCell | null)[][] = [
    blank(),
    actRow(
      `Заборгованість станом на ${asOfLabel(to)} року`,
      result.total,
      true
    ),
    row({ v: 'в т.ч.', span: COLUMN_COUNT }),
    actRow('внесок', result.body),
    actRow(interestLabel, result.interest),
    actRow('Інфляційні витрати', result.inflation),
    actRow('Юридичні послуги', result.legalFees),
    actRow('Держмито', result.courtFee),
    blank(),
    row({
      v: 'Інфляційні втрати — це значення останнього місяця, а не сума по колонці: коефіцієнт індексації накопичувальний.',
      span: COLUMN_COUNT,
    }),
    blank(),
    row(
      null,
      null,
      null,
      null,
      null,
      null,
      { v: 'Голова правління', bold: true, span: 2 },
      null,
      { v: '______________________', span: 3 }
    ),
    blank(),
    row({
      v: `Сформовано ${timestampLabel(generatedAt.toISOString())}`,
      span: COLUMN_COUNT,
    }),
  ]

  return {
    rows: [...head, ...table, ...act],
    columns: COLUMN_WIDTHS.map((wch) => ({ wch })),
    sheetName: SHEET_NAME,
  }
}

/** File name: company and period, stripped of spaces and slashes. */
export const debtCalculationFileName = (
  companyName?: string,
  from?: IYearMonth,
  to?: IYearMonth
): string =>
  [
    'Розрахунок-заборгованості',
    (companyName ?? '').trim().replace(/[\s/\\,]+/g, '-'),
    from && to ? `${formatPeriod(from)}_${formatPeriod(to)}` : '',
  ]
    .filter(Boolean)
    .join('_')
    .replace(/-+/g, '-')
