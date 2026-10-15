import dayjs from 'dayjs'
import {
  applyDateRangeToFilters,
  dateRangeFromPicker,
  dateRangeToPickerValue,
  dateRangeToQueryBounds,
  parseDateRange,
} from '@utils/paymentDateRange'

describe('parseDateRange()', () => {
  it('приймає два коректні дні у форматі YYYY-MM-DD', () => {
    expect(parseDateRange('2026-08-01', '2026-09-28')).toEqual({
      dateFrom: '2026-08-01',
      dateTo: '2026-09-28',
    })
  })

  it('бере перше значення, коли параметр URL прийшов масивом', () => {
    expect(parseDateRange(['2026-08-01'], ['2026-09-28'])).toEqual({
      dateFrom: '2026-08-01',
      dateTo: '2026-09-28',
    })
  })

  it('міняє межі місцями, якщо їх переставили', () => {
    expect(parseDateRange('2026-09-28', '2026-08-01')).toEqual({
      dateFrom: '2026-08-01',
      dateTo: '2026-09-28',
    })
  })

  it.each([
    ['немає однієї з меж', '2026-08-01', undefined],
    ['неіснуюча дата', '2026-02-30', '2026-03-01'],
    ['інший формат', '01.08.2026', '28.09.2026'],
    ['сміття', 'abc', '2026-03-01'],
  ])('повертає null: %s', (_, from, to) => {
    expect(parseDateRange(from, to)).toBeNull()
  })
})

describe('dateRangeFromPicker() / dateRangeToPickerValue()', () => {
  it('перетворює значення RangePicker на календарні дні', () => {
    expect(
      dateRangeFromPicker([dayjs('2026-08-01'), dayjs('2026-09-28')])
    ).toEqual({ dateFrom: '2026-08-01', dateTo: '2026-09-28' })
  })

  it('повертає null для очищеного picker', () => {
    expect(dateRangeFromPicker(null)).toBeNull()
    expect(dateRangeFromPicker([dayjs('2026-08-01'), null])).toBeNull()
  })

  it('відновлює значення picker із стану', () => {
    const value = dateRangeToPickerValue({
      dateFrom: '2025-12-31',
      dateTo: '2026-01-01',
    })
    expect(value?.map((d) => d.format('DD.MM.YYYY'))).toEqual([
      '31.12.2025',
      '01.01.2026',
    ])
  })

  it('повертає null, коли range у стані немає', () => {
    expect(dateRangeToPickerValue(undefined)).toBeNull()
    expect(dateRangeToPickerValue({})).toBeNull()
  })
})

describe('dateRangeToQueryBounds()', () => {
  it('нічого не додає до запиту без range', () => {
    expect(dateRangeToQueryBounds(undefined)).toEqual({})
    expect(dateRangeToQueryBounds({ dateFrom: '2026-08-01' })).toEqual({})
  })

  describe.each(['Europe/Kyiv', 'UTC', 'America/New_York', 'Asia/Tokyo'])(
    'без зсуву дат у часовому поясі %s',
    (tz) => {
      const originalTz = process.env.TZ

      beforeAll(() => {
        process.env.TZ = tz
      })
      afterAll(() => {
        process.env.TZ = originalTz
      })

      it.each([
        ['межа місяця', '2026-08-31', '2026-09-01'],
        ['межа року', '2025-12-31', '2026-01-01'],
        ['29 лютого', '2028-02-29', '2028-02-29'],
      ])('%s', (_, dateFrom, dateTo) => {
        const bounds = dateRangeToQueryBounds({ dateFrom, dateTo })

        // Read back in the same local timezone the table renders in.
        expect(dayjs(bounds.dateFrom).format('YYYY-MM-DD HH:mm')).toBe(
          `${dateFrom} 00:00`
        )
        expect(dayjs(bounds.dateTo).format('YYYY-MM-DD HH:mm:ss.SSS')).toBe(
          `${dateTo} 23:59:59.999`
        )
      })
    }
  )

  it('для Києва межі дня зміщені на UTC+3 влітку і UTC+2 взимку', () => {
    const originalTz = process.env.TZ
    process.env.TZ = 'Europe/Kyiv'
    try {
      expect(
        dateRangeToQueryBounds({ dateFrom: '2026-08-01', dateTo: '2026-12-31' })
      ).toEqual({
        dateFrom: '2026-07-31T21:00:00.000Z',
        dateTo: '2026-12-31T21:59:59.999Z',
      })
    } finally {
      process.env.TZ = originalTz
    }
  })
})

describe('applyDateRangeToFilters()', () => {
  const otherFilters = {
    domain: ['domain-1'],
    company: ['company-1'],
    type: ['debit'],
    street: ['street-1'],
    monthService: ['2026-month-7'],
  }

  it('додає range, не чіпаючи інших фільтрів', () => {
    expect(
      applyDateRangeToFilters(otherFilters, {
        dateFrom: '2026-08-01',
        dateTo: '2026-09-28',
      })
    ).toEqual({
      ...otherFilters,
      dateFrom: '2026-08-01',
      dateTo: '2026-09-28',
    })
  })

  it('очищення прибирає лише range', () => {
    expect(
      applyDateRangeToFilters(
        { ...otherFilters, dateFrom: '2026-08-01', dateTo: '2026-09-28' },
        null
      )
    ).toEqual(otherFilters)
  })

  it('працює, коли фільтрів ще немає', () => {
    expect(applyDateRangeToFilters(undefined, null)).toEqual({})
  })
})
