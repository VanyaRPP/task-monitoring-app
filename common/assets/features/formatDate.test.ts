import { formatInvoiceDate, formatInvoiceDueDate } from './formatDate'

describe('formatInvoiceDate', () => {
  it('форматує Date в DD.MM.YYYY', () => {
    expect(formatInvoiceDate(new Date('2024-03-15'))).toBe('15.03.2024')
  })

  it('форматує рядок ISO в DD.MM.YYYY', () => {
    expect(formatInvoiceDate('2024-01-05T00:00:00.000Z')).toBe('05.01.2024')
  })

  it('повертає порожній рядок для undefined', () => {
    expect(formatInvoiceDate(undefined)).toBe('')
  })

  it('повертає порожній рядок для null', () => {
    expect(formatInvoiceDate(null)).toBe('')
  })

  it('повертає порожній рядок для невалідної дати', () => {
    expect(formatInvoiceDate('not-a-date')).toBe('')
  })
})

describe('formatInvoiceDueDate', () => {
  it('додає 5 днів і форматує в DD.MM.YYYY за замовчуванням', () => {
    expect(formatInvoiceDueDate(new Date('2024-03-15'))).toBe('20.03.2024')
  })

  it('додає задану кількість днів', () => {
    expect(formatInvoiceDueDate(new Date('2024-03-15'), 10)).toBe('25.03.2024')
  })

  it('коректно переходить через межу місяця', () => {
    expect(formatInvoiceDueDate(new Date('2024-01-29'))).toBe('03.02.2024')
  })

  it('повертає порожній рядок для undefined', () => {
    expect(formatInvoiceDueDate(undefined)).toBe('')
  })

  it('повертає порожній рядок для null', () => {
    expect(formatInvoiceDueDate(null)).toBe('')
  })

  it('повертає порожній рядок для невалідної дати', () => {
    expect(formatInvoiceDueDate('not-a-date')).toBe('')
  })
})
