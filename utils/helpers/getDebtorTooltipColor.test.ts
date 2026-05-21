import { expect } from '@jest/globals'
import { getDebtorTooltipColor } from '@utils/helpers'

describe('getDebtorTooltipColor', () => {
  test('returns gray when debt is between 1 and 4999', () => {
    expect(getDebtorTooltipColor({ totalDebt: 1 })).toBe('gray')
    expect(getDebtorTooltipColor({ totalDebt: 4999 })).toBe('gray')
  })

  test('returns yellow when debt is between 5000 and 19999', () => {
    expect(getDebtorTooltipColor({ totalDebt: 5000 })).toBe('yellow')
    expect(getDebtorTooltipColor({ totalDebt: 19999 })).toBe('yellow')
  })

  test('returns red when debt is 20000 or more', () => {
    expect(getDebtorTooltipColor({ totalDebt: 20000 })).toBe('red')
    expect(getDebtorTooltipColor({ totalDebt: 50000 })).toBe('red')
  })

  test('returns undefined when debt is 0 or negative', () => {
    expect(getDebtorTooltipColor({ totalDebt: 0 })).toBeUndefined()
    expect(getDebtorTooltipColor({ totalDebt: -100 })).toBeUndefined()
  })
  test('returns undefined when totalDebt is NaN', () => {
    expect(getDebtorTooltipColor({ totalDebt: NaN })).toBeUndefined()
  })

  test('returns undefined when totalDebt is null', () => {
    expect(getDebtorTooltipColor({ totalDebt: null as any })).toBeUndefined()
  })

  test('throws error when debtor is undefined', () => {
    expect(() => getDebtorTooltipColor(undefined as any)).toThrow()
  })
})
