import { expect } from '@jest/globals'
import { roundMoney } from '..'

describe('roundMoney', () => {
  it('drops the noise float arithmetic leaves behind', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3)
    expect(roundMoney(0.1 * 3)).toBe(0.3)
  })

  it('rounds a half up even when the float sits just under it', () => {
    // 1.15 * 3.3 is 3.795 on paper but 3.7949999999999995 as a float.
    expect(roundMoney(1.15 * 3.3)).toBe(3.8)
    expect(roundMoney(2.675)).toBe(2.68)
  })

  it('keeps negative amounts and rounds them the same way', () => {
    expect(roundMoney(-100)).toBe(-100)
    expect(roundMoney(-1.15 * 3.3)).toBe(-3.8)
  })

  it('accepts numeric strings', () => {
    expect(roundMoney('12.345')).toBe(12.35)
  })

  it('gives 0 for anything that is not a number', () => {
    expect(roundMoney(undefined)).toBe(0)
    expect(roundMoney('abc')).toBe(0)
    expect(roundMoney(NaN)).toBe(0)
    expect(roundMoney(Infinity)).toBe(0)
  })
})
