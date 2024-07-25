import { expect } from '@jest/globals'
import { isEmpty } from '@utils/helpers'

describe('isEmpty', () => {
  describe('should be empty', () => {
    it('for undefined', () => {
      expect(isEmpty(undefined)).toBe(true)
    })

    it('for null', () => {
      expect(isEmpty(null)).toBe(true)
    })

    it('for an empty string', () => {
      expect(isEmpty('')).toBe(true)
    })

    it('for an empty array', () => {
      expect(isEmpty([])).toBe(true)
    })

    it('for an empty object', () => {
      expect(isEmpty({})).toBe(true)
    })
  })

  describe('should not be empty', () => {
    it('for a non-empty string', () => {
      expect(isEmpty('test')).toBe(false)
    })

    it('for a non-empty array', () => {
      expect(isEmpty([1])).toBe(false)
    })

    it('for a non-empty object', () => {
      expect(isEmpty({ key: 'value' })).toBe(false)
    })

    it('for a number', () => {
      expect(isEmpty(1)).toBe(false)
    })

    it('for a boolean', () => {
      expect(isEmpty(true)).toBe(false)
    })

    it('for a symbol', () => {
      expect(isEmpty(Symbol())).toBe(false)
    })

    it('for a function', () => {
      expect(isEmpty(() => null)).toBe(false)
    })
  })
})
