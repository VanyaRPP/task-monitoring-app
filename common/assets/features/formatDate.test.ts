import { formatInvoiceDate, formatInvoiceDueDate, dateToMonthYearEn } from './formatDate'

describe('dateToMonthYearEn', () => {
  it('форматує Date в англійський місяць і рік', () => {
    expect(dateToMonthYearEn(new Date('2024-03-15'))).toBe('March 2024')
  })

  it('форматує ISO рядок', () => {
    expect(dateToMonthYearEn('2024-01-05T00:00:00.000Z')).toBe('January 2024')
  })

  it('повертає англійську назву місяця, не українську', () => {
    const result = dateToMonthYearEn(new Date('2024-05-01'))
    expect(result).toBe('May 2024')
    expect(result).not.toMatch(/травень/i)
  })
})

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
