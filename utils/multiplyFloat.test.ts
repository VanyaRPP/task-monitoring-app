import { expect } from '@jest/globals'
import { multiplyFloat } from './helpers'

describe('Multiply float numbers and format result to .xx', () => {
  test('default calculation', () => {
    expect(multiplyFloat(0.144, 0.2)).toBe(0.02)
    expect(multiplyFloat((1/2), 0.2)).toBe(0.1)
    expect(multiplyFloat('0.144', '0.2')).toBe(0.02)
    expect(multiplyFloat('0.144', 0.2)).toBe(0.02)
    expect(multiplyFloat(0.144, 0.2)).toBe(0.02)

  })

  test('if unappropriate value', () => {
    expect(multiplyFloat(0.144, undefined)).toBe(0)
    expect(multiplyFloat(0.144, {})).toBe(0)
    expect(multiplyFloat(0.144, [])).toBe(0)
    expect(multiplyFloat(undefined, undefined)).toBe(0)
    expect(multiplyFloat(0.144, null)).toBe(0)
    expect(multiplyFloat(null, null)).toBe(0)
    expect(multiplyFloat('dd', 'dd')).toBe(0)
    expect(multiplyFloat(`${undefined}`, `${undefined}`)).toBe(0)
    expect(multiplyFloat(`${null}`, `${undefined}`)).toBe(0)
  })
})
