import { DEFAULT_INVOICE_TYPES, keepInvoiceRow } from './invoiceRowFilter'

// Loose factory so tests can pass partial / intentionally-invalid rows.
const row = (partial: Record<string, unknown>) => partial as any

describe('keepInvoiceRow', () => {
  it('keeps a row with a positive sum', () => {
    expect(keepInvoiceRow(row({ type: 'custom', sum: 225 }))).toBe(true)
  })

  it('keeps a row with a NEGATIVE sum (ad-hoc custom "Знижка")', () => {
    expect(
      keepInvoiceRow(row({ type: 'custom', name: 'Знижка', sum: -50 }))
    ).toBe(true)
  })

  it('keeps a negative sum provided as a numeric string', () => {
    expect(keepInvoiceRow(row({ type: 'custom', sum: '-50' }))).toBe(true)
  })

  it('drops a non-default row whose sum is exactly 0', () => {
    expect(keepInvoiceRow(row({ type: 'custom', sum: 0 }))).toBe(false)
  })

  it('drops rows with empty / non-numeric / missing sum', () => {
    expect(keepInvoiceRow(row({ type: 'custom', sum: undefined }))).toBe(false)
    expect(keepInvoiceRow(row({ type: 'custom', sum: '' }))).toBe(false)
    expect(keepInvoiceRow(row({ type: 'custom', sum: 'abc' }))).toBe(false)
    expect(keepInvoiceRow(null)).toBe(false)
    expect(keepInvoiceRow(undefined)).toBe(false)
  })

  it('keeps every default service type even when sum is 0', () => {
    for (const type of DEFAULT_INVOICE_TYPES) {
      expect(keepInvoiceRow(row({ type, sum: 0 }))).toBe(true)
    }
  })

  it('a non-default type is dropped at sum 0 but kept when non-zero', () => {
    expect(keepInvoiceRow(row({ type: 'waterPrice', sum: 0 }))).toBe(false)
    expect(keepInvoiceRow(row({ type: 'waterPrice', sum: -1 }))).toBe(true)
  })
})
