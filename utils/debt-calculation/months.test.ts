import {
  buildMonthRange,
  daysInMonth,
  daysInYear,
  formatPeriod,
  isLeapYear,
  isWithinPeriod,
  parsePeriod,
  periodKey,
} from './months'

describe('isLeapYear / daysInYear', () => {
  it('визначає високосні роки', () => {
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(2000)).toBe(true)
    expect(isLeapYear(1900)).toBe(false)
    expect(isLeapYear(2023)).toBe(false)
  })

  it('дає дільник для річних', () => {
    expect(daysInYear(2024)).toBe(366)
    expect(daysInYear(2025)).toBe(365)
  })
})

describe('daysInMonth', () => {
  it('рахує звичайні місяці', () => {
    expect(daysInMonth(2021, 11)).toBe(30)
    expect(daysInMonth(2021, 12)).toBe(31)
    expect(daysInMonth(2022, 1)).toBe(31)
  })

  it('рахує лютий з урахуванням високосності', () => {
    expect(daysInMonth(2022, 2)).toBe(28)
    expect(daysInMonth(2024, 2)).toBe(29)
  })
})

describe('buildMonthRange', () => {
  it('включає обидві межі', () => {
    expect(
      buildMonthRange({ year: 2024, month: 11 }, { year: 2025, month: 2 })
    ).toEqual([
      { year: 2024, month: 11 },
      { year: 2024, month: 12 },
      { year: 2025, month: 1 },
      { year: 2025, month: 2 },
    ])
  })

  it('дає один місяць, коли межі збігаються', () => {
    expect(
      buildMonthRange({ year: 2024, month: 5 }, { year: 2024, month: 5 })
    ).toEqual([{ year: 2024, month: 5 }])
  })

  it('покриває період Акта — 44 місяці', () => {
    const range = buildMonthRange(
      { year: 2021, month: 11 },
      { year: 2025, month: 6 }
    )

    expect(range).toHaveLength(44)
    expect(range[43]).toEqual({ year: 2025, month: 6 })
  })

  it('порожній, якщо кінець раніше за початок', () => {
    expect(
      buildMonthRange({ year: 2025, month: 3 }, { year: 2025, month: 1 })
    ).toEqual([])
  })

  it('порожній на неповних або хибних межах', () => {
    expect(buildMonthRange(undefined, { year: 2025, month: 1 })).toEqual([])
    expect(buildMonthRange({ year: 2025, month: 1 }, undefined)).toEqual([])
    expect(
      buildMonthRange({ year: 2025, month: 0 }, { year: 2025, month: 3 })
    ).toEqual([])
    expect(
      buildMonthRange({ year: 2025, month: 13 }, { year: 2026, month: 3 })
    ).toEqual([])
  })
})

describe('periodKey', () => {
  it('зростає рівно на 1 за кожен місяць, зокрема через Новий рік', () => {
    expect(periodKey({ year: 2024, month: 12 }) + 1).toBe(
      periodKey({ year: 2025, month: 1 })
    )
  })

  it('дає порядок, придатний для сортування', () => {
    expect(periodKey({ year: 2021, month: 11 })).toBeLessThan(
      periodKey({ year: 2022, month: 1 })
    )
  })
})

describe('isWithinPeriod', () => {
  const from = { year: 2021, month: 12 }
  const to = { year: 2022, month: 2 }

  it('включає обидві межі', () => {
    expect(isWithinPeriod({ year: 2021, month: 12 }, from, to)).toBe(true)
    expect(isWithinPeriod({ year: 2022, month: 2 }, from, to)).toBe(true)
  })

  it('відсікає місяці за межами', () => {
    expect(isWithinPeriod({ year: 2021, month: 11 }, from, to)).toBe(false)
    expect(isWithinPeriod({ year: 2022, month: 3 }, from, to)).toBe(false)
  })

  it('пропускає все, коли межі не задані', () => {
    expect(isWithinPeriod({ year: 1999, month: 7 })).toBe(true)
  })

  it('працює з однією межею', () => {
    expect(isWithinPeriod({ year: 2022, month: 6 }, from)).toBe(true)
    expect(isWithinPeriod({ year: 2021, month: 1 }, from)).toBe(false)
    expect(isWithinPeriod({ year: 2021, month: 1 }, undefined, to)).toBe(true)
  })
})

describe('parsePeriod / formatPeriod', () => {
  it('розбирає YYYY-MM з одно- і двоцифровим місяцем', () => {
    expect(parsePeriod('2021-11')).toEqual({ year: 2021, month: 11 })
    expect(parsePeriod('2022-1')).toEqual({ year: 2022, month: 1 })
    expect(parsePeriod(' 2022-03 ')).toEqual({ year: 2022, month: 3 })
  })

  it('повертає null на хибний формат або місяць', () => {
    expect(parsePeriod('2021/11')).toBeNull()
    expect(parsePeriod('2021-13')).toBeNull()
    expect(parsePeriod('2021-00')).toBeNull()
    expect(parsePeriod('листопад')).toBeNull()
    expect(parsePeriod(undefined)).toBeNull()
  })

  it('форматує з провідним нулем і робить круговий обхід', () => {
    expect(formatPeriod({ year: 2021, month: 3 })).toBe('2021-03')
    expect(parsePeriod(formatPeriod({ year: 2025, month: 6 }))).toEqual({
      year: 2025,
      month: 6,
    })
  })
})
