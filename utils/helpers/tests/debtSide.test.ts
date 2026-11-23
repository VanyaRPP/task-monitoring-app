import { formatDebtAmount, formatSignedDebt, getDebtSide } from '..'

describe('getDebtSide', () => {
  it('returns "company" when totalDebt is positive', () => {
    expect(getDebtSide(0.01)).toBe('company')
    expect(getDebtSide(1)).toBe('company')
    expect(getDebtSide(999999)).toBe('company')
  })

  it('returns "domain" when totalDebt is negative', () => {
    expect(getDebtSide(-0.01)).toBe('domain')
    expect(getDebtSide(-1)).toBe('domain')
    expect(getDebtSide(-999999)).toBe('domain')
  })

  it('returns null when the balance is settled', () => {
    expect(getDebtSide(0)).toBeNull()
    expect(getDebtSide(-0)).toBeNull()
  })

  it('returns null for non-finite values', () => {
    expect(getDebtSide(NaN)).toBeNull()
    expect(getDebtSide(Infinity)).toBeNull()
    expect(getDebtSide(null as any)).toBeNull()
    expect(getDebtSide(undefined as any)).toBeNull()
  })
})

describe('formatDebtAmount', () => {
  it('formats a positive debt as-is', () => {
    expect(formatDebtAmount(0)).toBe('0.00')
    expect(formatDebtAmount(10)).toBe('10.00')
    expect(formatDebtAmount(10.456)).toBe('10.46')
  })

  it('formats a negative debt as its absolute value', () => {
    expect(formatDebtAmount(-10)).toBe('10.00')
    expect(formatDebtAmount(-10.456)).toBe('10.46')
    expect(formatDebtAmount(-20000)).toBe('20000.00')
  })

  it('produces the same output for opposite signs of the same amount', () => {
    for (const amount of [0.01, 1, 4999, 5000, 20000, 12345.67]) {
      expect(formatDebtAmount(-amount)).toBe(formatDebtAmount(amount))
    }
  })

  it('applies the sub-cent rounding to negative amounts too', () => {
    expect(formatDebtAmount(-0.001)).toBe(formatDebtAmount(0.001))
    expect(formatDebtAmount(-0.001)).toBe('0.10')
  })
})

describe('formatSignedDebt', () => {
  it('keeps a debt owed by the company unsigned', () => {
    expect(formatSignedDebt(10)).toBe('10.00')
    expect(formatSignedDebt(12345.67)).toBe('12345.67')
  })

  it('marks a debt owed by the domain with a minus', () => {
    expect(formatSignedDebt(-10)).toBe('-10.00')
    expect(formatSignedDebt(-12345.67)).toBe('-12345.67')
    expect(formatSignedDebt(-0.001)).toBe('-0.10')
  })

  it('leaves a settled balance without a sign', () => {
    expect(formatSignedDebt(0)).toBe('0.00')
    expect(formatSignedDebt(-0)).toBe('0.00')
  })
})
