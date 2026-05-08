import dayjs from 'dayjs'
import {
  combineDayWithCurrentTime,
  dateShiftMs,
  dateToMonthYearEn,
  formatInvoiceDate,
  formatInvoiceDueDate,
} from './formatDate'

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

describe('dateShiftMs', () => {
  it('зсуває Date на +1мс', () => {
    const base = new Date('2024-03-15T10:00:00.000Z')
    const result = dateShiftMs(base, 1)
    expect(result.getTime()).toBe(base.getTime() + 1)
  })

  it('зсуває рядок ISO на +1мс', () => {
    const base = '2024-03-15T10:00:00.000Z'
    const result = dateShiftMs(base, 1)
    expect(result.getTime()).toBe(new Date(base).getTime() + 1)
  })

  it('повертає Date', () => {
    expect(dateShiftMs(new Date(), 1)).toBeInstanceOf(Date)
  })
})

describe('combineDayWithCurrentTime', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-05-08T16:15:15.123Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('бере день із вибраної дати, час із поточного моменту (UTC)', () => {
    const result = combineDayWithCurrentTime(dayjs('2026-04-27'))
    expect(result.getUTCFullYear()).toBe(2026)
    expect(result.getUTCMonth()).toBe(3) // April = 3 in 0-indexed
    expect(result.getUTCDate()).toBe(27)
    expect(result.getUTCHours()).toBe(16)
    expect(result.getUTCMinutes()).toBe(15)
    expect(result.getUTCSeconds()).toBe(15)
    expect(result.getUTCMilliseconds()).toBe(123)
  })

  it('повертає поточний Date коли вхід undefined', () => {
    expect(combineDayWithCurrentTime(undefined).toISOString()).toBe(
      '2026-05-08T16:15:15.123Z'
    )
  })

  it('повертає поточний Date коли вхід null', () => {
    expect(combineDayWithCurrentTime(null).toISOString()).toBe(
      '2026-05-08T16:15:15.123Z'
    )
  })

  it('зберігає рік 2024 коли вибраний день у минулому році', () => {
    const result = combineDayWithCurrentTime(dayjs('2024-12-31'))
    expect(result.getUTCFullYear()).toBe(2024)
    expect(result.getUTCMonth()).toBe(11)
    expect(result.getUTCDate()).toBe(31)
  })
})
