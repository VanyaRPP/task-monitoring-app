import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - WATER-PART', () => {
  describe('props: { service }', () => {
    it('should NOT load when service = null', () => {
      const service: Partial<IService> = null

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when service = { waterPriceTotal: 10 }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when service = { waterPriceTotal: 0 }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 0,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when service = { waterPriceTotal: NaN }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: NaN,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when service = { waterPriceTotal: null }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: null,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when service = { waterPriceTotal: undefined }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: undefined,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
  })

  describe('props: { company }', () => {
    it('should NOT load when company = null', () => {
      const company: Partial<IRealestate> = null

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when company = { waterPart: 10 }', () => {
      const company: Partial<IRealestate> = {
        waterPart: 10,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when company = { waterPart: 0 }', () => {
      const company: Partial<IRealestate> = {
        waterPart: 0,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when company = { waterPart: NaN }', () => {
      const company: Partial<IRealestate> = {
        waterPart: NaN,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when company = { waterPart: null }', () => {
      const company: Partial<IRealestate> = {
        waterPart: null,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when company = { waterPart: undefined }', () => {
      const company: Partial<IRealestate> = {
        waterPart: undefined,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
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
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when service = { waterPriceTotal: 10 }, company = { waterPart: 10 }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = {
        waterPart: 10,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when service = { waterPriceTotal: 0 }, company = { waterPart: 0 }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 0,
      }
      const company: Partial<IRealestate> = {
        waterPart: 0,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when service = { waterPriceTotal: 10 }, company = null', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = null

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when service = { waterPriceTotal: 10 }, company = { ... }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = {
        totalArea: 0,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should load when service = { waterPriceTotal: 10 }, company = { waterPart: 0 }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = {
        waterPart: 0,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 0,
        sum: 0,
      })
    })
    it('should load when service = { waterPriceTotal: 10 }, company = { waterPart: 10 }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = {
        waterPart: 10,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 1,
        sum: 1,
      })
    })
    it('should load when service = { waterPriceTotal: 10 }, company = { waterPart: null }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = {
        waterPart: null,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when service = { waterPriceTotal: 10 }, company = { waterPart: undefined }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = {
        waterPart: undefined,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
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
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when service = null, company = null, prevPayment = { invoice: [WaterPart] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.WaterPart,
            price: 10,
            sum: 10,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when service = { waterPriceTotal: 10 }, company = null, prevPayment = { invoice: [WaterPart] }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.WaterPart,
            price: 10,
            sum: 10,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when service = { waterPriceTotal: 10 }, company = null, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 10,
            amount: 10,
            lastAmount: 0,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should load when service = { waterPriceTotal: 10 }, company = { waterPart: 10 }, prevPayment = { invoice: [WaterPart] }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = {
        waterPart: 10,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.WaterPart,
            price: 15,
            sum: 15,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 1,
        sum: 1,
      })
    })
    it('should load when service = { waterPriceTotal: 10 }, company = { waterPart: 10 }, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = {
        waterPart: 10,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 10,
            amount: 10,
            lastAmount: 0,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 1,
        sum: 1,
      })
    })
    it('should NOT load when service = { waterPriceTotal: 10 }, company = { ... }, prevPayment = { invoice: [WaterPart] }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = {
        totalArea: 10,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.WaterPart,
            price: 100,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
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
        type: ServiceType.WaterPart,
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
        type: ServiceType.WaterPart,
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
        type: ServiceType.WaterPart,
      })
    })
    it('should NOT load when payment = { invoice: [Electricity] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 10,
            amount: 10,
            lastAmount: 0,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual({
        type: ServiceType.WaterPart,
      })
    })
    it('should load when payment = { invoice: [WaterPart] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.WaterPart,
            price: 10,
            sum: 10,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 10,
        sum: 10,
      })
    })
    it('should load when payment = { invoice: [WaterPart, Water] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Water,
            amount: 10,
            lastAmount: 0,
            price: 10,
            sum: 100,
          },
          {
            type: ServiceType.WaterPart,
            price: 10,
            sum: 10,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 10,
        sum: 10,
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
        type: ServiceType.WaterPart,
      })
    })
    it('should load when service = null, company = null, payment = { invoice: [WaterPart] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.WaterPart,
            price: 12,
            sum: 12,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 12,
        sum: 12,
      })
    })
    it('should load when service = { waterPriceTotal: 10 }, company = null, payment = { invoice: [WaterPart] }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.WaterPart,
            price: 12,
            sum: 12,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 12,
        sum: 12,
      })
    })
    it('should load when service = null, company = { waterPart: 10 }, payment = { invoice: [WaterPart] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = {
        waterPart: 10,
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.WaterPart,
            price: 12,
            sum: 12,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 12,
        sum: 12,
      })
    })
    it('should load when service = { waterPriceTotal: 10 }, company = { waterPart: 10 }, payment = { invoice: [WaterPart] }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = {
        waterPart: 10,
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.WaterPart,
            price: 12,
            sum: 12,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 12,
        sum: 12,
      })
    })
    it('should load when service = null, company = null, payment = { invoice: [Water, WaterPart] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Water,
            price: 12,
            amount: 10,
            lastAmount: 0,
            sum: 120,
          },
          {
            type: ServiceType.WaterPart,
            price: 100,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 100,
        sum: 100,
      })
    })
    it('should load when service = { waterPriceTotal: 10 }, company = null, payment = { invoice: [Water, WaterPart] }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Water,
            price: 12,
            amount: 10,
            lastAmount: 0,
            sum: 120,
          },
          {
            type: ServiceType.WaterPart,
            price: 100,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 100,
        sum: 100,
      })
    })
    it('should load when service = null, company = { waterPart: 10 }, payment = { invoice: [Water, WaterPart] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = {
        waterPart: 10,
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Water,
            price: 12,
            amount: 10,
            lastAmount: 0,
            sum: 120,
          },
          {
            type: ServiceType.WaterPart,
            price: 100,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 100,
        sum: 100,
      })
    })
    it('should load when service = { waterPriceTotal: 10 }, company = { waterPart: 10 }, payment = { invoice: [Water, WaterPart] }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = {
        waterPart: 10,
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Water,
            price: 12,
            amount: 10,
            lastAmount: 0,
            sum: 120,
          },
          {
            type: ServiceType.WaterPart,
            price: 100,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 100,
        sum: 100,
      })
    })
  })
})
