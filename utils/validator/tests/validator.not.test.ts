import { expect } from '@jest/globals'
import validator from '@utils/validator'
import { RuleObject } from 'antd/es/form'

const testRule = async (not: any, value: any): Promise<boolean> => {
  return await (
    (validator.not(not) as RuleObject).validator(
      null,
      value,
      () => null
    ) as Promise<any>
  )
    .then(() => true)
    .catch(() => false)
}

describe('validator - not', () => {
  describe('should resolve', () => {
    it('for [0, 1]', async () => {
      expect(await testRule(0, 1)).toEqual(true)
    })
    it('for [-1, 1]', async () => {
      expect(await testRule(-1, 1)).toEqual(true)
    })
    it('for [0, undefined]', async () => {
      expect(await testRule(0, undefined)).toEqual(true)
    })
    it('for [1, undefined]', async () => {
      expect(await testRule(1, undefined)).toEqual(true)
    })
    it('for [0, null]', async () => {
      expect(await testRule(0, null)).toEqual(true)
    })
    it('for [1, null]', async () => {
      expect(await testRule(1, null)).toEqual(true)
    })
    it('for [0, 0.0000001]', async () => {
      expect(await testRule(0, 0.0000001)).toEqual(true)
    })
    it('for [1, "1"]', async () => {
      expect(await testRule(1, '1')).toEqual(true)
    })
    it('for ["1", 1]', async () => {
      expect(await testRule('1', 1)).toEqual(true)
    })
  })

  describe('should reject', () => {
    it('for [0, 0]', async () => {
      expect(await testRule(0, 0)).toEqual(false)
    })
    it('for [1, 1]', async () => {
      expect(await testRule(1, 1)).toEqual(false)
    })
    it('for [0.0000001, 0.0000001]', async () => {
      expect(await testRule(0.0000001, 0.0000001)).toEqual(false)
    })
    it('for [null, null]', async () => {
      expect(await testRule(null, null)).toEqual(false)
    })
    it('for [undefined, undefined]', async () => {
      expect(await testRule(undefined, undefined)).toEqual(false)
    })
    it('for ["test", "test"]', async () => {
      expect(await testRule('test', 'test')).toEqual(false)
    })
  })
})
