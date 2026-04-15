import { expect } from '@jest/globals'
import { Types } from 'mongoose'
import { ServiceType } from '@utils/constants'
import { getSingleCustomServiceInvoice } from '@utils/getInvoices'
import { IService } from '@common/api/serviceApi/service.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'


type ServiceCustomItem = NonNullable<IService['customServices']>[number]
type CompanyCustomItem = NonNullable<IRealestate['customServices']>[number]

const mockServiceCustom = (
  overrides: Partial<ServiceCustomItem> = {}
): ServiceCustomItem => ({
  _id: new Types.ObjectId() as any,
  label: 'Service custom',
  fieldName: 'customField',
  price: 100,
  ...overrides,
})

const mockCompanyCustom = (
  overrides: Partial<CompanyCustomItem> = {}
): CompanyCustomItem => ({
  _id: new Types.ObjectId() as any,
  label: 'Company custom',
  fieldName: 'customField',
  price: 150,
  ...overrides,
})

describe('getSingleCustomServiceInvoice', () => {
  describe('invalid fieldName', () => {
    it.each([undefined, null, ''])(
      'should return undefined when fieldName = %p',
      (fieldName) => {
        const result = getSingleCustomServiceInvoice({
          service: {},
          company: {},
          fieldName: fieldName as any,
        })

        expect(result).toBeUndefined()
      }
    )
  })

  describe('service custom not found', () => {
    it('should return undefined when service has no matching custom service', () => {
      const service: Partial<IService> = {
        customServices: [
          mockServiceCustom({ fieldName: 'anotherField' }),
        ],
      }

      const company: Partial<IRealestate> = {
        customServices: [
          mockCompanyCustom(),
        ],
      }

      const result = getSingleCustomServiceInvoice({
        service,
        company,
        fieldName: 'customField',
      })

      expect(result).toBeUndefined()
    })
  })

  describe('price resolving', () => {
    it('should take price from company custom service if exists', () => {
      const service: Partial<IService> = {
        customServices: [
          mockServiceCustom({ price: 100 }),
        ],
      }

      const company: Partial<IRealestate> = {
        customServices: [
          mockCompanyCustom({ price: 200 }),
        ],
      }

      const result = getSingleCustomServiceInvoice({
        service,
        company,
        fieldName: 'customField',
      })

      expect(result).toEqual({
        name: 'Service custom',
        type: ServiceType.Custom,
        fieldName: 'customField',
        amount: 1,
        serviceId: expect.any(String),
        price: 200,
        sum: 200,
      })
    })

    it('should fallback to service price when company custom not found', () => {
      const service: Partial<IService> = {
        customServices: [
          mockServiceCustom({ price: 120 }),
        ],
      }

      const company: Partial<IRealestate> = {
        customServices: [],
      }

      const result = getSingleCustomServiceInvoice({
        service,
        company,
        fieldName: 'customField',
      })

      expect(result?.price).toBe(120)
      expect(result?.sum).toBe(120)
    })

    it('should allow price = 0', () => {
      const service: Partial<IService> = {
        customServices: [
          mockServiceCustom({ price: 50 }),
        ],
      }

      const company: Partial<IRealestate> = {
        customServices: [
          mockCompanyCustom({ price: 0 }),
        ],
      }

      const result = getSingleCustomServiceInvoice({
        service,
        company,
        fieldName: 'customField',
      })

      expect(result?.price).toBe(0)
      expect(result?.sum).toBe(0)
    })
  })

  describe('happy path', () => {
    it('should return correct invoice object', () => {
      const service: Partial<IService> = {
        customServices: [mockServiceCustom()],
      }

      const company: Partial<IRealestate> = {
        customServices: [mockCompanyCustom()],
      }

      const result = getSingleCustomServiceInvoice({
        service,
        company,
        fieldName: 'customField',
      })

      expect(result).toEqual({
        name: 'Service custom',
        type: ServiceType.Custom,
        fieldName: 'customField',
        amount: 1,
        serviceId: expect.any(String),
        price: 150,
        sum: 150,
      })
    })
  })
})
