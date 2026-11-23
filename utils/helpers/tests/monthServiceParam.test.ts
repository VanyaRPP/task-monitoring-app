import {
  MONTH_SERVICE_QUERY_PARAM,
  formatMonthServiceParam,
  parseMonthServiceParam,
  resolvePaymentDateFilterQuery,
} from '@utils/helpers'

describe('parseMonthServiceParam()', () => {
  it('перетворює `YYYY-MM` з URL у значення фільтра таблиці', () => {
    expect(parseMonthServiceParam('2026-07')).toEqual(['2026-month-7'])
  })

  it('розбирає кілька місяців, перелічених через кому', () => {
    expect(parseMonthServiceParam('2026-07,2026-12')).toEqual([
      '2026-month-7',
      '2026-month-12',
    ])
  })

  it('приймає параметр, повторений в URL кілька разів', () => {
    expect(parseMonthServiceParam(['2026-07', '2025-01'])).toEqual([
      '2026-month-7',
      '2025-month-1',
    ])
  })

  it('зберігає позначений цілий рік', () => {
    expect(parseMonthServiceParam('2026')).toEqual(['2026'])
  })

  it('повертає порожній список, коли параметра немає', () => {
    expect(parseMonthServiceParam(undefined)).toEqual([])
    expect(parseMonthServiceParam('')).toEqual([])
  })

  it('відкидає зіпсовані токени, не ламаючи решту посилання', () => {
    expect(parseMonthServiceParam('2026-13,липень,2026-00,2026-08')).toEqual([
      '2026-month-8',
    ])
  })

  it('прибирає дублікати', () => {
    expect(parseMonthServiceParam('2026-07,2026-7')).toEqual(['2026-month-7'])
  })
})

describe('formatMonthServiceParam()', () => {
  it('перетворює значення фільтра на `YYYY-MM` з провідним нулем', () => {
    expect(formatMonthServiceParam(['2026-month-7'])).toBe('2026-07')
  })

  it('склеює кілька місяців через кому', () => {
    expect(formatMonthServiceParam(['2026-month-7', '2026-month-12'])).toBe(
      '2026-07,2026-12'
    )
  })

  it('повертає undefined, коли фільтр порожній — параметр прибирається з URL', () => {
    expect(formatMonthServiceParam(undefined)).toBeUndefined()
    expect(formatMonthServiceParam([])).toBeUndefined()
  })

  it('ігнорує значення, які не є місяцем чи роком', () => {
    expect(formatMonthServiceParam(['всі', '2026-month-3'])).toBe('2026-03')
  })
})

describe('monthService в URL', () => {
  it('переживає повний оберт URL → фільтр → URL', () => {
    const param = '2026-07,2025-01'
    expect(formatMonthServiceParam(parseMonthServiceParam(param))).toBe(param)
  })

  it('дає запит до бекенду за місяцем надання послуг', () => {
    expect(
      resolvePaymentDateFilterQuery({
        monthService: parseMonthServiceParam('2026-07'),
      })
    ).toEqual({ dateField: 'date', year: 2026, month: 7 })
  })

  it('називається так само, як поле платежу', () => {
    expect(MONTH_SERVICE_QUERY_PARAM).toBe('monthService')
  })
})
