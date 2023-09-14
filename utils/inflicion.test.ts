import { getInflicionValue } from './inflicion'
import { expect } from '@jest/globals'

describe('getInflicionValue', () => {
  test('default calculation', () => {
    expect(getInflicionValue(12500, 100.5)).toBe('62.50')
    expect(getInflicionValue(1000, 101.5)).toBe('15.00')
    expect(getInflicionValue(100, 101.5)).toBe('1.50')
  })
  test('if less than 0 - return zero', () => {
    expect(getInflicionValue(12500, 95.5)).toBe('0.00')
    expect(getInflicionValue(1000, 99.5)).toBe('0.00')
    expect(getInflicionValue(100, 99.5)).toBe('0.00')
  })
})
