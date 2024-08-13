import { expect } from '@jest/globals'
import { plusFloat } from '..'

describe('Multiply float numbers and format result to .xx', () => {
  test('default calculation', () => {
    expect(plusFloat(0.1, 0.2)).toBe(0.3)
    expect(plusFloat(1 / 2, 0.2)).toBe(0.7)
    expect(plusFloat('0.144', '0.2')).toBe(0.34)
    expect(plusFloat('0.144', 0.2)).toBe(0.34)
    //format
    expect(plusFloat(1, 2)).toBe(3)
    expect(plusFloat(1, 2.5)).toBe(3.5)
    expect(plusFloat(1, 2.05)).toBe(3.05)
    expect(plusFloat(1, 2.005)).toBe(3)
  })

  test('if unappropriate value', () => {
    expect(plusFloat(0.144, undefined)).toBe(0.14)
    expect(plusFloat(0.144, {})).toBe(0.14)
    expect(plusFloat(0.144, [])).toBe(0.14)
    expect(plusFloat(undefined, undefined)).toBe(0)
    expect(plusFloat(0.144, null)).toBe(0.14)
    expect(plusFloat(null, null)).toBe(0)
    expect(plusFloat('dd', 'dd')).toBe(0)
    expect(plusFloat(`${undefined}`, `${undefined}`)).toBe(0)
    expect(plusFloat(`${null}`, `${undefined}`)).toBe(0)
  })
})
