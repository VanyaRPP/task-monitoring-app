import { formatDebt } from '..'

describe('formatDebt', () => {
  test('returns 0.00 when amount is 0', () => {
    expect(formatDebt(0)).toBe('0.00')
  })

  test('rounds up values smaller than 0.01', () => {
    expect(formatDebt(0.001)).toBe('0.10')
    expect(formatDebt(0.009)).toBe('0.90')
    expect(formatDebt(-0.001)).toBe('0.10') // Додано перевірку для дрібних переплат
  })

  test('formats values equal or greater than 0.01 with two decimals', () => {
    expect(formatDebt(0.01)).toBe('0.01')
    expect(formatDebt(10)).toBe('10.00')
    expect(formatDebt(10.456)).toBe('10.46')
  })

  test('formats negative values correctly as absolute values (Math.abs)', () => {
    expect(formatDebt(-5)).toBe('5.00')
    expect(formatDebt(-3.456)).toBe('3.46')
  })

  test('returns "0.00" when amount is NaN', () => {
    expect(formatDebt(NaN)).toBe('0.00')
  })

  test('returns "0.00" when amount is undefined', () => {
    // В новій логіці Number(undefined) дає NaN, що безпечно повертає '0.00'
    expect(formatDebt(undefined as any)).toBe('0.00')
  })
})
