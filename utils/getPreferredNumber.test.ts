import { expect } from '@jest/globals'
import { getPreferredNumber } from './helpers'

describe('getPreferredNumber', () => {
  test('default calculation', () => {
    expect(getPreferredNumber([1, 2, 3])).toBe(1)
    expect(getPreferredNumber([1])).toBe(1)
    expect(getPreferredNumber([undefined, 1])).toBe(1)
  })
  test('fallback', () => {
    expect(getPreferredNumber([])).toBe(0)
    expect(getPreferredNumber([], 2)).toBe(2)
    expect(getPreferredNumber([], true)).toBe(true)
  })
})
