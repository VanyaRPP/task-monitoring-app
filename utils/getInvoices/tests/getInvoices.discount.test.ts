import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - DISCOUNT', () => {
  describe('props: { company }', () => {
    it('should NOT load when company = null', () => {
      const company: Partial<IRealestate> = null

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when company = { discount: 1000 }', () => {
      const company: Partial<IRealestate> = {
        discount: 1000,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when company = { discount: 0 }', () => {
      const company: Partial<IRealestate> = {
        discount: 0,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when company = { discount: NaN }', () => {
      const company: Partial<IRealestate> = {
        discount: NaN,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when company = { discount: null }', () => {
      const company: Partial<IRealestate> = {
        discount: null,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when company = { discount: undefined }', () => {
      const company: Partial<IRealestate> = {
        discount: undefined,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
  })
  describe('props: { service }', () => {
    it('should NOT load when service = null', () => {
      const service: Partial<IService> = null

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when service = { rentPrice: 1000 }', () => {
      const service: Partial<IService> = {
        rentPrice: 1000,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when service = { rentPrice: 0 }', () => {
      const service: Partial<IService> = {
        rentPrice: 0,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when service = { rentPrice: NaN }', () => {
      const service: Partial<IService> = {
        rentPrice: NaN,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when service = { rentPrice: null }', () => {
      const service: Partial<IService> = {
        rentPrice: null,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when service = { rentPrice: undefined }', () => {
      const service: Partial<IService> = {
        rentPrice: undefined,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
  })
  describe('props: { service, company }', () => {
    it('should NOT load when service = null, company = null', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when service = { rentPrice: 1000 }, company = {discount: 1000 }', () => {
      const service: Partial<IService> = {
        rentPrice: 1000,
      }
      const company: Partial<IRealestate> = {
        discount: 1000,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when service = { rentPrice: 0 }, company = {discount: 0 }', () => {
      const service: Partial<IService> = {
        rentPrice: 0,
      }
      const company: Partial<IRealestate> = {
        discount: 0,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when service = { rentPrice: 1000 }, company = null ', () => {
      const service: Partial<IService> = {
        rentPrice: 1000,
      }
      const company: Partial<IRealestate> = null

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should load when service = { ... }, company = { discount: 1000 } ', () => {
      const service: Partial<IService> = {
        rentPrice: 1000,
      }
      const company: Partial<IRealestate> = {
        discount: 1000,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Discount,
        price: 1000,
        sum: 1000,
      })
    })
    it('should load when service = { rentPrice: 0 }, company = { discount: 1000 } ', () => {
      const service: Partial<IService> = {
        rentPrice: 0,
      }
      const company: Partial<IRealestate> = {
        discount: 1000,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Discount,
        price: 1000,
        sum: 1000,
      })
    })
    it('should load when service = { rentPrice: null }, company = { discount: 1000 } ', () => {
      const service: Partial<IService> = {
        rentPrice: null,
      }
      const company: Partial<IRealestate> = {
        discount: 1000,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Discount,
        price: 1000,
        sum: 1000,
      })
    })
    it('should load when service = { rentPrice: undefined }, company = { discount: 1000 } ', () => {
      const service: Partial<IService> = {
        rentPrice: undefined,
      }
      const company: Partial<IRealestate> = {
        discount: 1000,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Discount,
        price: 1000,
        sum: 1000,
      })
    })
  })
  describe('props: { service, company, prevPayment }', () => {
    it('should NOT load when service = null, company = null, prevPayment = null', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = null

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when service = null, company = null, prevPayment = { invoice: [Discount] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Discount,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when service = null, company = null, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when service = { rentPrice: 1000 }, company = { discount: 1000 }, prevPayment = { invoice: [Discount] }', () => {
      const service: Partial<IService> = {
        rentPrice: 1000,
      }
      const company: Partial<IRealestate> = {
        discount: 1000,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Discount,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when service = { rentPrice: 1000 }, company = { discount: 1000 }, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = {
        rentPrice: 1000,
      }
      const company: Partial<IRealestate> = {
        discount: 1000,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should load when service = { ... }, company = { discount: 1000 }, prevPayment = { invoice: [Discount] }', () => {
      const service: Partial<IService> = {
        rentPrice: 1000,
      }
      const company: Partial<IRealestate> = {
        discount: 1000,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Discount,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Discount,
        price: 1000,
        sum: 1000,
      })
    })
  })
  describe('props: { payment }', () => {
    it('should NOT load when payment = null', () => {
      const payment: Partial<IPayment> = null

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when payment = { invoice: null }', () => {
      const payment: Partial<IPayment> = {
        invoice: null,
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when payment = { invoice: [] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should NOT load when payment = { invoice: [Electricity] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should load when payment = { invoice: [Discount] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Discount,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Discount,
        price: 1000,
        sum: 1000,
      })
    })
  })
  describe('props: { service, company, payment } with prio to payment', () => {
    it('should NOT load when service = null, company = null, payment = null', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = null

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.Discount,
      })
    })
    it('should load when service = null, company = null, payment = { invoice: [Discount] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Discount,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Discount,
        price: 1000,
        sum: 1000,
      })
    })
    it('should load when service = null, company = { cleaning: 10 }, payment = { invoice: [Discount] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = {
        discount: 100,
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Discount,
            price: 1000,
            sum: 1000,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Discount,
        price: 1000,
        sum: 1000,
      })
    })
  })
})
