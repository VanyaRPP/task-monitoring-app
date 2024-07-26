import { expect } from '@jest/globals'
import { isEqual } from '@utils/helpers'

describe('isEqual', () => {
  describe('should be equal', () => {
    it('for two equal numbers', () => {
      expect(isEqual(1, 1)).toBe(true)
    })

    it('for two equal strings', () => {
      expect(isEqual('test', 'test')).toBe(true)
    })

    it('for two equal arrays', () => {
      expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    })

    it('for two equal objects', () => {
      expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    })

    it('for nested objects with equal values', () => {
      expect(isEqual({ a: { b: 2 } }, { a: { b: 2 } })).toBe(true)
    })

    it('for two null values', () => {
      expect(isEqual(null, null)).toBe(true)
    })
  })

  describe('should not be equal', () => {
    it('for two different numbers', () => {
      expect(isEqual(1, 2)).toBe(false)
    })

    it('for two different strings', () => {
      expect(isEqual('test', 'test1')).toBe(false)
    })

    it('for two different arrays', () => {
      expect(isEqual([1, 2, 3], [1, 2, 4])).toBe(false)
    })

    it('for two different objects', () => {
      expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false)
    })

    it('for nested objects with different values', () => {
      expect(isEqual({ a: { b: 2 } }, { a: { b: 3 } })).toBe(false)
    })

    it('for null and undefined', () => {
      expect(isEqual(null, undefined)).toBe(false)
    })

    it('for different types', () => {
      expect(isEqual(1, '1')).toBe(false)
    })

    it('for different boolean values', () => {
      expect(isEqual(true, false)).toBe(false)
    })

    it('for different symbols', () => {
      expect(isEqual(Symbol('test'), Symbol('test'))).toBe(false)
    })

    it('for a function and null', () => {
      expect(isEqual(() => null, null)).toBe(false)
    })
  })
})
