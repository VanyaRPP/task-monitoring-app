import { expect } from '@jest/globals'
import validator from '@utils/validator'
import { RuleObject } from 'antd/es/form'

const testRule = async (value: any): Promise<boolean> => {
  return await (
    (validator.required() as RuleObject).validator(
      null,
      value,
      () => null
    ) as Promise<any>
  )
    .then(() => true)
    .catch(() => false)
}

describe('validator - required', () => {
  describe('should resolve', () => {
    it("for ['string']", async () => {
      expect(await testRule('string')).toEqual(true)
    })
    it('for [1]', async () => {
      expect(await testRule(1)).toEqual(true)
    })
    it('for [0]', async () => {
      expect(await testRule(0)).toEqual(true)
    })
    it('for [{ key: null }]', async () => {
      expect(await testRule({ key: null })).toEqual(true)
    })
    it("for [{ key: 'value' }]", async () => {
      expect(await testRule({ key: 'value' })).toEqual(true)
    })
    it('for [[0]]', async () => {
      expect(await testRule([0])).toEqual(true)
    })
    it("for [['value']]", async () => {
      expect(await testRule(['value'])).toEqual(true)
    })
  })

  describe('should reject', () => {
    it("for ['']", async () => {
      expect(await testRule('')).toEqual(false)
    })
    it('for [undefined]', async () => {
      expect(await testRule(undefined)).toEqual(false)
    })
    it('for [null]', async () => {
      expect(await testRule(null)).toEqual(false)
    })
    it('for [{}]', async () => {
      expect(await testRule({})).toEqual(false)
    })
    it('for [[]]', async () => {
      expect(await testRule([])).toEqual(false)
    })
  })
})
