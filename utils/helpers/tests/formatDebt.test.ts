import { formatDebt } from '..'

describe('formatDebt', () => {
  test('returns 0.00 when amount is 0', () => {
    expect(formatDebt(0)).toBe('0.00')
  })

  test('rounds up values smaller than 0.01', () => {
    expect(formatDebt(0.001)).toBe('0.10')
    expect(formatDebt(0.009)).toBe('0.90')
  })

  test('formats values equal or greater than 0.01 with two decimals', () => {
    expect(formatDebt(0.01)).toBe('0.01')
    expect(formatDebt(10)).toBe('10.00')
    expect(formatDebt(10.456)).toBe('10.46')
  })

  test('formats negative values correctly', () => {
    expect(formatDebt(-5)).toBe('-5.00')
    expect(formatDebt(-3.456)).toBe('-3.46')
  })

  test('returns "NaN" when amount is NaN', () => {
    expect(formatDebt(NaN)).toBe('NaN')
  })

  test('throws error when amount is undefined', () => {
    expect(() => formatDebt(undefined as any)).toThrow()
  })
})
