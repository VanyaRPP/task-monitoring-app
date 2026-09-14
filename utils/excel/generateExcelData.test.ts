import dayjs from 'dayjs'
import 'dayjs/locale/uk'

dayjs.locale('uk')

jest.mock('@assets/features/formatDate', () => ({
  dateToDefaultFormat: jest.fn(() => '01.06.2026'),
}))

import {
  generatePaymentsData,
  getAutoColSize,
  getPaymentsRowSize,
} from './generateExcelData'

const basePayment = {
  domain: { name: 'Домен А' },
  company: { companyName: 'Компанія А' },
  invoiceCreationDate: '2026-06-01T00:00:00.000Z',
  type: 'debit',
  generalSum: 12500,
  invoice: [],
}

describe('generatePaymentsData', () => {
  it('puts the sum under Дебет and "-" under Кредит for a debit payment', () => {
    const [row] = generatePaymentsData([basePayment])
    expect(row['Дебет'].v).toBe('12 500')
    expect(row['Кредит'].v).toBe('-')
  })

  it('puts the sum under Кредит and "-" under Дебет for a credit payment', () => {
    const [row] = generatePaymentsData([
      { ...basePayment, type: 'credit', generalSum: 100 },
    ])
    expect(row['Кредит'].v).toBe('100')
    expect(row['Дебет'].v).toBe('-')
  })

  it('shows "-" for both columns when generalSum is null', () => {
    const [row] = generatePaymentsData([{ ...basePayment, generalSum: null }])
    expect(row['Дебет'].v).toBe('-')
    expect(row['Кредит'].v).toBe('-')
  })

  it('reads domain and company names, leaving them undefined when missing', () => {
    const [row] = generatePaymentsData([basePayment])
    expect(row['Надавач послуг'].v).toBe('Домен А')
    expect(row['Компанія'].v).toBe('Компанія А')

    const [emptyRow] = generatePaymentsData([
      { ...basePayment, domain: undefined, company: undefined },
    ])
    expect(emptyRow['Надавач послуг'].v).toBeUndefined()
    expect(emptyRow['Компанія'].v).toBeUndefined()
  })

  it('formats "За місяць" from monthService.date, or "-" when absent', () => {
    const [withMonth] = generatePaymentsData([
      { ...basePayment, monthService: { date: new Date(2026, 5, 1) } },
    ])
    expect(withMonth['За місяць'].v).toBe('червень 2026')

    const [withoutMonth] = generatePaymentsData([basePayment])
    expect(withoutMonth['За місяць'].v).toBe('-')
  })

  it('looks up each service column from the invoice array, case-insensitively', () => {
    const [row] = generatePaymentsData([
      {
        ...basePayment,
        invoice: [
          { type: 'PlacingPrice', sum: 200 },
          { type: 'maintenancePrice', sum: 1000000 },
        ],
      },
    ])
    expect(row['Розміщення'].v).toBe('200')
    expect(row['Утримання'].v).toBe('1 000 000')
  })

  it('shows "-" for a service column with no matching invoice item', () => {
    const [row] = generatePaymentsData([basePayment])
    expect(row['Водопостачання'].v).toBe('-')
  })

  it('formats a fractional sum to 2 decimal places with thousands grouping', () => {
    const [row] = generatePaymentsData([
      { ...basePayment, invoice: [{ type: 'waterPrice', sum: 1234.567 }] },
    ])
    expect(row['Водопостачання'].v).toBe('1 234.57')
  })

  it('tolerates a payment with no invoice array at all', () => {
    const { invoice, ...withoutInvoice } = basePayment
    const [row] = generatePaymentsData([withoutInvoice])
    expect(row['Розміщення'].v).toBe('-')
    expect(row['Додаткові послуги'].v).toBe('-')
  })

  it('pulls "Додаткові послуги" from the first custom-type invoice item', () => {
    const [row] = generatePaymentsData([
      {
        ...basePayment,
        invoice: [
          { type: 'maintenancePrice', sum: 100 },
          { type: 'custom', price: 750 },
        ],
      },
    ])
    expect(row['Додаткові послуги'].v).toBe('750')
  })

  it('shows "-" for "Додаткові послуги" when there is no custom invoice item', () => {
    const [row] = generatePaymentsData([basePayment])
    expect(row['Додаткові послуги'].v).toBe('-')
  })

  it('wraps every cell with cell styling, using a distinct color for the name columns', () => {
    const [row] = generatePaymentsData([basePayment])

    expect(row['Надавач послуг'].s.font.color).toEqual({ rgb: 'B366FF' })
    expect(row['Компанія'].s.font.color).toEqual({ rgb: 'B366FF' })
    expect(row['Дебет'].s.font.color).toEqual({ rgb: 'DDDDDD' })
    expect(row['Дебет'].s).toMatchObject({
      font: { name: 'Arial', sz: 11 },
      alignment: { horizontal: 'center', vertical: 'center' },
    })
  })
})

describe('getAutoColSize', () => {
  it('returns [] for an empty or non-array input', () => {
    expect(getAutoColSize([])).toEqual([])
    expect(getAutoColSize(undefined as any)).toEqual([])
    expect(getAutoColSize(null as any)).toEqual([])
  })

  it('sizes each column to the widest of its header or cell text, plus 5', () => {
    const data = [
      { A: { v: 'x' }, B: { v: 12345 } },
      { A: { v: 'a longer value' }, B: { v: 1 } },
    ]
    const sizes = getAutoColSize(data)
    // header 'A' (1) vs 'x' (1) vs 'a longer value' (14) -> 14 + 5
    expect(sizes[0]).toEqual({ wch: 19 })
    // header 'B' (1) vs '12345' (5) vs '1' (1) -> 5 + 5
    expect(sizes[1]).toEqual({ wch: 10 })
  })

  it('treats a cell with no v, or a non-string/number v, as empty text', () => {
    const data = [{ A: {} }, { A: { v: { nested: true } } }]
    const sizes = getAutoColSize(data)
    // header 'A' is the widest thing available -> 1 + 5
    expect(sizes[0]).toEqual({ wch: 6 })
  })
})

describe('getPaymentsRowSize', () => {
  it('prefixes a taller header row before one row per data item', () => {
    expect(getPaymentsRowSize([{}, {}, {}])).toEqual([
      { hpt: 40 },
      { hpt: 32 },
      { hpt: 32 },
      { hpt: 32 },
    ])
  })

  it('returns just the header row size for empty data', () => {
    expect(getPaymentsRowSize([])).toEqual([{ hpt: 40 }])
  })
})
