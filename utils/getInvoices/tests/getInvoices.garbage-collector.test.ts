import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - GARBAGE COLLECTOR', () => {
  describe('props: { service }', () => {
    it('should NOT load when service = null', () => {
      const service: Partial<IService> = null

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when service = { garbageCollectorPrice: 10 }', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: 10,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when service = { garbageCollectorPrice: 0 }', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: 0,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when service = { garbageCollectorPrice: NaN }', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: NaN,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when service = { garbageCollectorPrice: null }', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: null,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when service = { garbageCollectorPrice: undefined }', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: undefined,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
  })

  describe('props: { company }', () => {
    it('should NOT load when company = null', () => {
      const company: Partial<IRealestate> = null

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when company = { rentPart: 10 }', () => {
      const company: Partial<IRealestate> = {
        rentPart: 10,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when company = { rentPart: 0 }', () => {
      const company: Partial<IRealestate> = {
        rentPart: 0,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when company = { rentPart: NaN }', () => {
      const company: Partial<IRealestate> = {
        rentPart: NaN,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when company = { rentPart: null }', () => {
      const company: Partial<IRealestate> = {
        rentPart: null,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when company = { rentPart: undefined }', () => {
      const company: Partial<IRealestate> = {
        rentPart: undefined,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })

    it('should NOT load when company = { garbageCollector: false }', () => {
      const company: Partial<IRealestate> = {
        garbageCollector: false,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })

    it('should NOT load when company = { garbageCollector: true }', () => {
      const company: Partial<IRealestate> = {
        garbageCollector: true,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when service = { garbageCollectorPrice: 10 }, company = { rentPart: 10, garbageCollector: false }', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: 10,
      }
      const company: Partial<IRealestate> = {
        rentPart: 10,
        garbageCollector: false,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when service = { garbageCollectorPrice: 10 }, company = null', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: 10,
      }
      const company: Partial<IRealestate> = null

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when service = { garbageCollectorPrice: 10 }, company = { ... }', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: 10,
      }
      const company: Partial<IRealestate> = {
        discount: 0,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should load when service = { garbageCollectorPrice: 10 }, company = { rentPart: 10, garbageCollector: true }', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: 10,
      }
      const company: Partial<IRealestate> = {
        rentPart: 10,
        garbageCollector: true,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.GarbageCollector,
        price: 1,
        sum: 1,
      })
    })
    it('should load when service = { garbageCollectorPrice: 0 }, company = { rentPart: 0, garbageCollector: true }', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: 0,
      }
      const company: Partial<IRealestate> = {
        rentPart: 0,
        garbageCollector: true,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.GarbageCollector,
        price: 0,
        sum: 0,
      })
    })
    it('should load when service = { garbageCollectorPrice: 10 }, company = { rentPart: 0, garbageCollector: true }', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: 10,
      }
      const company: Partial<IRealestate> = {
        rentPart: 0,
        garbageCollector: true,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.GarbageCollector,
        price: 0,
        sum: 0,
      })
    })
  })

  describe('props: { payment }', () => {
    it('should NOT load when payment = null', () => {
      const payment: Partial<IPayment> = null

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when payment = { invoice: null }', () => {
      const payment: Partial<IPayment> = {
        invoice: null,
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when payment = { invoice: [] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should load when payment = { invoice: [GarbageCollector] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.GarbageCollector,
            price: 15,
            sum: 13,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.GarbageCollector,
        price: 13,
        sum: 13,
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when service = null, company = null, payment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            price: 15,
            sum: 12,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when service = { garbageCollectorPrice: 10 }, company = { rentPart: 10, garbageCollector: false }, payment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: 10,
      }
      const company: Partial<IRealestate> = {
        rentPart: 10,
        garbageCollector: false,
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            price: 15,
            sum: 12,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should NOT load when service = { garbageCollectorPrice: 10 }, company = { rentPart: 10, garbageCollector: true }, payment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: 10,
      }
      const company: Partial<IRealestate> = {
        rentPart: 10,
        garbageCollector: true,
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            price: 15,
            sum: 12,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.GarbageCollector })
      )
    })
    it('should load when service = null, company = null, payment = { invoice: [GarbageCollector] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.GarbageCollector,
            price: 15,
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
        type: ServiceType.GarbageCollector,
        price: 12,
        sum: 12,
      })
    })
    it('should load when service = { garbageCollectorPrice: 10 }, company = null, payment = { invoice: [GarbageCollector] }', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: 10,
      }
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.GarbageCollector,
            price: 15,
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
        type: ServiceType.GarbageCollector,
        price: 12,
        sum: 12,
      })
    })
    it('should load when service = null, company = { totalArea: 10 }, payment = { invoice: [GarbageCollector] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = {
        totalArea: 10,
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.GarbageCollector,
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
        type: ServiceType.GarbageCollector,
        price: 12,
        sum: 12,
      })
    })
    it('should load when service = { garbageCollectorPrice: 10 }, company = { rentPart: 10, garbageCollector: true }, payment = { invoice: [GarbageCollector] }', () => {
      const service: Partial<IService> = {
        garbageCollectorPrice: 10,
      }
      const company: Partial<IRealestate> = {
        rentPart: 10,
        garbageCollector: true,
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.GarbageCollector,
            price: 15,
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
        type: ServiceType.GarbageCollector,
        price: 12,
        sum: 12,
      })
    })
  })
})
