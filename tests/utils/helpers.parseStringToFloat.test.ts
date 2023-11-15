import { expect } from '@jest/globals'
import { parseStringToFloat } from '../../utils/helpers'

describe('Parse string to float', () => {
  test('default calculation', () => {
    expect(parseStringToFloat('12,12')).toBe('12.12')
    expect(parseStringToFloat('123,1')).toBe('123.10')
    expect(parseStringToFloat('0')).toBe('0.00')
    expect(parseStringToFloat('1.12')).toBe('1.12')
  })

  test('if unappropriate value', () => {
    expect(parseStringToFloat('')).toBe('0.00')
    expect(parseStringToFloat(undefined)).toBe('0.00')
    expect(parseStringToFloat(null)).toBe('0.00')
    expect(parseStringToFloat(NaN)).toBe('0.00')
    expect(parseStringToFloat('asafs')).toBe('0.00')
    expect(parseStringToFloat([])).toBe('0.00')
    expect(parseStringToFloat({})).toBe('0.00')
  })
})
