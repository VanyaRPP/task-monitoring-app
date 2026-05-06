import { expect } from '@jest/globals'
import validator from '@utils/validator'
import { RuleObject } from 'antd/es/form'

const testRule = async (min: any, value: any): Promise<boolean> => {
  return await (
    (validator.min(min) as RuleObject).validator(
      null,
      value,
      () => null
    ) as Promise<any>
  )
    .then(() => true)
    .catch(() => false)
}

describe('validator - min', () => {
  describe('should always resolve (negative values allowed)', () => {
    it('for [0, 1]', async () => {
      expect(await testRule(0, 1)).toEqual(true)
    })
    it('for [0, "1"]', async () => {
      expect(await testRule(0, '1')).toEqual(true)
    })
    it('for [-1, 0]', async () => {
      expect(await testRule(-1, 0)).toEqual(true)
    })
    it('for [1, "1.1"]', async () => {
      expect(await testRule(1, '1.1')).toEqual(true)
    })
    it('for [1, "2"]', async () => {
      expect(await testRule(1, '2')).toEqual(true)
    })
    it('for [0, 0.0000001]', async () => {
      expect(await testRule(0, 0.0000001)).toEqual(true)
    })
    it('for [0, -1]', async () => {
      expect(await testRule(0, -1)).toEqual(true)
    })
    it('for [1, 0]', async () => {
      expect(await testRule(1, 0)).toEqual(true)
    })
    it('for [1, "0"]', async () => {
      expect(await testRule(1, '0')).toEqual(true)
    })
    it('for [1, "0.5"]', async () => {
      expect(await testRule(1, '0.5')).toEqual(true)
    })
    it('for [1, 0.9999999]', async () => {
      expect(await testRule(1, 0.9999999)).toEqual(true)
    })
    it('for [1, null]', async () => {
      expect(await testRule(1, null)).toEqual(true)
    })
    it('for [1, undefined]', async () => {
      expect(await testRule(1, undefined)).toEqual(true)
    })
  })
})
