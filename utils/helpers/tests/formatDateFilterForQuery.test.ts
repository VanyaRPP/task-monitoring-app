import { formatDateFilterForQuery } from '@utils/helpers'

describe('formatDateFilterForQuery', () => {
  it('returns {} for undefined or an empty array', () => {
    expect(formatDateFilterForQuery(undefined)).toEqual({})
    expect(formatDateFilterForQuery([])).toEqual({})
  })

  it('parses a bare year', () => {
    expect(formatDateFilterForQuery(['2026'])).toEqual({ year: 2026 })
  })

  it('parses a single "year-month" leaf', () => {
    expect(formatDateFilterForQuery(['2026-6'])).toEqual({
      year: 2026,
      month: 6,
    })
  })

  it('collects multiple months checked under the same year, without the year leaking into month', () => {
    // Regression: the year used to get flattened alongside the months
    // (month: [6, 2026, 8]) because every "year-month" leaf repeats the year.
    expect(formatDateFilterForQuery(['2026-6', '2026-8'])).toEqual({
      year: 2026,
      month: [6, 8],
    })
  })

  it('keeps every month checked when three or more are selected in one year', () => {
    expect(formatDateFilterForQuery(['2026-3', '2026-6', '2026-9'])).toEqual({
      year: 2026,
      month: [3, 6, 9],
    })
  })

  it('ignores entries that parse to neither a valid leading number nor number', () => {
    expect(formatDateFilterForQuery(['not-a-date'])).toEqual({})
  })
})
