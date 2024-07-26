import { expect } from '@jest/globals'
import validator from '@utils/validator'
import { RuleObject } from 'antd/es/form'

const testRule = async (max: any, value: any): Promise<boolean> => {
  return await (
    (validator.max(max) as RuleObject).validator(
      null,
      value,
      () => null
    ) as Promise<any>
  )
    .then(() => true)
    .catch(() => false)
}

describe('validator - max', () => {
  describe('should resolve', () => {
    it('for [1, 0]', async () => {
      expect(await testRule(1, 0)).toEqual(true)
    })
    it('for [1, "0"]', async () => {
      expect(await testRule(1, '0')).toEqual(true)
    })
    it('for [1, 1]', async () => {
      expect(await testRule(1, 1)).toEqual(true)
    })
    it('for [1, "1"]', async () => {
      expect(await testRule(1, '1')).toEqual(true)
    })
    it('for [1, "0.5"]', async () => {
      expect(await testRule(1, '0.5')).toEqual(true)
    })
    it('for [1, 0.9999999]', async () => {
      expect(await testRule(1, 0.9999999)).toEqual(true)
    })
  })

  describe('should reject', () => {
    it('for [1, 2]', async () => {
      expect(await testRule(1, 2)).toEqual(false)
    })
    it('for [1, "2"]', async () => {
      expect(await testRule(1, '2')).toEqual(false)
    })
    it('for [1, "2.5"]', async () => {
      expect(await testRule(1, '2.5')).toEqual(false)
    })
    it('for [0, 0.0000001]', async () => {
      expect(await testRule(0, 0.0000001)).toEqual(false)
    })
    it('for [1, "not a number"]', async () => {
      expect(await testRule(1, 'not a number')).toEqual(false)
    })
    it('for [1, null]', async () => {
      expect(await testRule(1, null)).toEqual(false)
    })
    it('for [1, undefined]', async () => {
      expect(await testRule(1, undefined)).toEqual(false)
    })
    it('for [1, {}]', async () => {
      expect(await testRule(1, {})).toEqual(false)
    })
    it('for [1, []]', async () => {
      expect(await testRule(1, [])).toEqual(false)
    })
    it('for [1, true]', async () => {
      expect(await testRule(1, true)).toEqual(false)
    })
    it('for [1, Symbol()]', async () => {
      expect(await testRule(1, Symbol())).toEqual(false)
    })
    it('for [1, () => null]', async () => {
      expect(await testRule(1, () => null)).toEqual(false)
    })
  })
})
