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
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('бере день із вибраної дати, час із поточного моменту (локальний час)', () => {
    jest.setSystemTime(new Date(2026, 4, 8, 16, 15, 15, 123))

    const result = combineDayWithCurrentTime(dayjs(new Date(2026, 3, 27)))
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(3)
    expect(result.getDate()).toBe(27)
    expect(result.getHours()).toBe(16)
    expect(result.getMinutes()).toBe(15)
    expect(result.getSeconds()).toBe(15)
    expect(result.getMilliseconds()).toBe(123)
  })

  it('повертає поточний Date коли вхід undefined', () => {
    const now = new Date(2026, 4, 8, 16, 15, 15, 123)
    jest.setSystemTime(now)

    expect(combineDayWithCurrentTime(undefined).getTime()).toBe(now.getTime())
  })

  it('повертає поточний Date коли вхід null', () => {
    const now = new Date(2026, 4, 8, 16, 15, 15, 123)
    jest.setSystemTime(now)

    expect(combineDayWithCurrentTime(null).getTime()).toBe(now.getTime())
  })

  it('зберігає рік 2024 коли вибраний день у минулому році', () => {
    jest.setSystemTime(new Date(2026, 4, 8, 16, 15, 15, 123))

    const result = combineDayWithCurrentTime(dayjs(new Date(2024, 11, 31)))
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(11)
    expect(result.getDate()).toBe(31)
  })

  it('не зсуває дату під час повторного редагування одразу після півночі', () => {
    const createdLocal = new Date(2026, 6, 4, 12, 0, 0)
    const createdAt = combineDayWithCurrentTime(dayjs(createdLocal))
    expect(dayjs(createdAt).date()).toBe(4)
    expect(dayjs(createdAt).month()).toBe(6)

    jest.setSystemTime(new Date(2026, 6, 5, 0, 30, 0))

    let stored = createdAt
    for (let i = 0; i < 5; i++) {
      stored = combineDayWithCurrentTime(dayjs(stored))
    }

    expect(dayjs(stored).date()).toBe(4)
    expect(dayjs(stored).month()).toBe(6)
    expect(dayjs(stored).year()).toBe(2026)
  })

  it('не зсуває дату під час серії редагувань у різний час доби', () => {
    const createdLocal = new Date(2026, 0, 14, 23, 0, 0)
    const createdAt = combineDayWithCurrentTime(dayjs(createdLocal))
    expect(dayjs(createdAt).date()).toBe(14)

    const editTimes = [
      new Date(2026, 0, 15, 0, 5, 0),
      new Date(2026, 0, 15, 0, 45, 0),
      new Date(2026, 0, 15, 8, 0, 0),
      new Date(2026, 0, 15, 23, 59, 0),
    ]

    let stored = createdAt
    for (const t of editTimes) {
      jest.setSystemTime(t)
      stored = combineDayWithCurrentTime(dayjs(stored))
    }

    expect(dayjs(stored).date()).toBe(14)
    expect(dayjs(stored).month()).toBe(0)
    expect(dayjs(stored).year()).toBe(2026)
  })
})
