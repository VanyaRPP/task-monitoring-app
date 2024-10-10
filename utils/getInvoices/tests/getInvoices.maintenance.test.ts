import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - MAINTENANCE', () => {
  describe('props: { service }', () => {
    it('should NOT load when service = null', () => {
      const service: Partial<IService> = null

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should NOT load when service = { rentPrice: 10 }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should NOT load when service = { rentPrice: 0 }', () => {
      const service: Partial<IService> = {
        rentPrice: 0,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should NOT load when service = { rentPrice: NaN }', () => {
      const service: Partial<IService> = {
        rentPrice: NaN,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should NOT load when service = { rentPrice: null }', () => {
      const service: Partial<IService> = {
        rentPrice: null,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should NOT load when service = { rentPrice: undefined }', () => {
      const service: Partial<IService> = {
        rentPrice: undefined,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
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
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should NOT load when company = { totalArea: 10 }', () => {
      const company: Partial<IRealestate> = {
        totalArea: 10,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should NOT load when company = { totalArea: 0 }', () => {
      const company: Partial<IRealestate> = {
        totalArea: 0,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should NOT load when company = { totalArea: NaN }', () => {
      const company: Partial<IRealestate> = {
        totalArea: NaN,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should NOT load when company = { totalArea: null }', () => {
      const company: Partial<IRealestate> = {
        totalArea: null,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should NOT load when company = { totalArea: undefined }', () => {
      const company: Partial<IRealestate> = {
        totalArea: undefined,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
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
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should NOT load when service = { rentPrice: 10 }, company = null', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = null

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should NOT load when service = { rentPrice: 10 }, company = { ... }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = {
        discount: 0,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should load when service = { rentPrice: 0 }, company = { totalArea: 0 }', () => {
      const service: Partial<IService> = {
        rentPrice: 0,
      }
      const company: Partial<IRealestate> = {
        totalArea: 0,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should load when service = { rentPrice: 0 }, company = { totalArea: 10 }', () => {
      const service: Partial<IService> = {
        rentPrice: 0,
      }
      const company: Partial<IRealestate> = {
        totalArea: 10,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Maintenance,
        amount: 10,
        price: 0,
        sum: 0,
      })
    })
    it('should load when service = { rentPrice: 10 }, company = { totalArea: 0 }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = {
        totalArea: 0,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Maintenance,
        amount: 0,
        price: 10,
        sum: 0,
      })
    })
    it('should load when service = { rentPrice: 10 }, company = { totalArea: 10 }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = {
        totalArea: 10,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
  })

  describe('props: { payment }', () => {
    it('should NOT load when payment = null', () => {
      const payment: Partial<IPayment> = null

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
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
        expect.objectContaining({ type: ServiceType.Maintenance })
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
        expect.objectContaining({ type: ServiceType.Maintenance })
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
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should load when payment = { invoice: [Maintenance] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Maintenance,
            amount: 17,
            price: 15,
            sum: 13,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Maintenance,
        amount: 17,
        price: 15,
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
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should NOT load when service = { rentPrice: 10 }, company = { totalArea: 10 }, payment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = {
        totalArea: 10,
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            amount: 10,
            lastAmount: 10,
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Maintenance })
      )
    })
    it('should load when service = null, company = null, payment = { invoice: [Maintenance] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Maintenance,
            amount: 10,
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
        type: ServiceType.Maintenance,
        amount: 10,
        price: 12,
        sum: 12,
      })
    })
    it('should load when service = { rentPrice: 10 }, company = null, payment = { invoice: [Maintenance] }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Maintenance,
            amount: 10,
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
        type: ServiceType.Maintenance,
        amount: 10,
        price: 12,
        sum: 12,
      })
    })
    it('should load when service = null, company = { totalArea: 10 }, payment = { invoice: [Maintenance] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = {
        totalArea: 10,
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Maintenance,
            amount: 10,
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
        type: ServiceType.Maintenance,
        amount: 10,
        price: 12,
        sum: 12,
      })
    })
    it('should load when service = { rentPrice: 10 }, company = { totalArea: 10 }, payment = { invoice: [Maintenance] }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = {
        totalArea: 10,
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Maintenance,
            amount: 10,
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
        type: ServiceType.Maintenance,
        amount: 10,
        price: 12,
        sum: 12,
      })
    })
  })
})
