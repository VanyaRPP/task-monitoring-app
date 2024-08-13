import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - cleaning', () => {
  describe('props: { company }', () => {
    it('should NOT load when company = null', () => {
      const company: Partial<IRealestate> = null

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
    it('should NOT load when company = { cleaning: 10 }', () => {
      const company: Partial<IRealestate> = {
        cleaning: 10,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
    it('should NOT load when company = { cleaning: 0 }', () => {
      const company: Partial<IRealestate> = {
        cleaning: 0,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
    it('should NOT load when company = { cleaning: NaN }', () => {
      const company: Partial<IRealestate> = {
        cleaning: NaN,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
    it('should NOT load when company = { cleaning: null }', () => {
      const company: Partial<IRealestate> = {
        cleaning: null,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
    it('should NOT load when company = { cleaning: undefined }', () => {
      const company: Partial<IRealestate> = {
        cleaning: undefined,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
  })

  describe('props: { service }', () => {
    it('should NOT load when service = null', () => {
      const service: Partial<IService> = null

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
    it('should NOT load when service = { ... }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
    it('should NOT load when service = null, company = null, prevPayment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            price: 10,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
    it('should NOT load when service = null, company = null, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 10,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
    it('should NOT load when service = null, company = { cleaning: 10 }, prevPayment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = {
        cleaning: 10,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            price: 10,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
    it('should NOT load when service = null, company = { cleaning: 10 }, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = {
        cleaning: 10,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 10,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
    it('should load when service = { ... }, company = { cleaning: 10 }, prevPayment = null', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = {
        cleaning: 10,
      }
      const prevPayment: Partial<IPayment> = null

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Cleaning,
        price: 10,
        sum: 10,
      })
    })
    it('should load when service = { ... }, company = { cleaning: 10 }, prevPayment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = {
        cleaning: 10,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            price: 10,
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
        type: ServiceType.Cleaning,
        price: 10,
        sum: 10,
      })
    })
    it('should load when service = { ... }, company = { cleaning: 10 }, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = {
        cleaning: 10,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 10,
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
        type: ServiceType.Cleaning,
        price: 10,
        sum: 10,
      })
    })
    it('should load when service = { ... }, company = { cleaning: 0 }, prevPayment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = {
        cleaning: 0,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            price: 10,
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
        type: ServiceType.Cleaning,
        price: 0,
        sum: 0,
      })
    })
    it('should load when service = { ... }, company = { cleaning: 0 }, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = {
        cleaning: 0,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 10,
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
        type: ServiceType.Cleaning,
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
        expect.objectContaining({ type: ServiceType.Cleaning})
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
        expect.objectContaining({ type: ServiceType.Cleaning})
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
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
    it('should NOT load when payment = { invoice: [Electricity] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 10,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
    it('should load when payment = { invoice: [Cleaning] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            price: 10,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Cleaning,
        price: 10,
        sum: 100,
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
        expect.objectContaining({ type: ServiceType.Cleaning})
      )
    })
    it('should load when service = null, company = null, payment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            price: 12,
            sum: 120,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Cleaning,
        price: 12,
        sum: 120,
      })
    })
    it('should load when service = null, company = { cleaning: 10 }, payment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = {
        cleaning: 10,
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            price: 12,
            sum: 120,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Cleaning,
        price: 12,
        sum: 120,
      })
    })
  })
})
