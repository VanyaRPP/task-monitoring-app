import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - ELECTRICITY', () => {
  describe('props: { service }', () => {
    it('should NOT load when service = null', () => {
      const service: Partial<IService> = null

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })

    it('should NOT load when service = { electricityPrice: 10 }', () => {
      const service: Partial<IService> = {
        electricityPrice: 10,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })

    it('should NOT load when service = { electricityPrice: 0 }', () => {
      const service: Partial<IService> = {
        electricityPrice: 0,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })

    it('should NOT load when service = { electricityPrice: NaN }', () => {
      const service: Partial<IService> = {
        electricityPrice: NaN,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })

    it('should NOT load when service = { electricityPrice: null }', () => {
      const service: Partial<IService> = {
        electricityPrice: null,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })

    it('should NOT load when service = { electricityPrice: undefined }', () => {
      const service: Partial<IService> = {
        electricityPrice: undefined,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
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
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })

    it('should NOT load when company = { discount: 0 }', () => {
      const company: Partial<IRealestate> = {
        discount: 0,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })
    
    it('should NOT load when company = { discount: 10 }', () => {
      const company: Partial<IRealestate> = {
        discount: 10,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })

    it('should NOT load when company = { discount: NaN }', () => {
      const company: Partial<IRealestate> = {
        discount: NaN,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })

    it('should NOT load when company = { discount: null }', () => {
      const company: Partial<IRealestate> = {
        discount: null,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })

    it('should NOT load when company = { discount: undefined }', () => {
      const company: Partial<IRealestate> = {
        discount: undefined,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
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
        expect.objectContaining({ type: ServiceType.Electricity})
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
        expect.objectContaining({ type: ServiceType.Electricity})
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
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })
    it('should NOT load when payment = { invoice: [Cleaning] }', () => {
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })
    it('should load when payment = { invoice: [Electricity] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            amount: 12,
            lastAmount: 1,
            price: 10,
            sum: 110,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Electricity,
        amount: 12,
        lastAmount: 1,
        price: 10,
        sum: 110,
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })

    it('should NOT load when service = null, company = null, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            amount: 12,
            lastAmount: 1,
            price: 10,
            sum: 110,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })
    
    it('should NOT load when service = null, company = null, prevPayment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            amount: 12,
            lastAmount: 1,
            price: 10,
            sum: 110,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })

    it('should NOT load when service = { electricityPrice: 10 }, company = null, prevPayment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = {
        electricityPrice: 10,
      }
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            amount: 12,
            lastAmount: 1,
            price: 10,
            sum: 110,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })

    it('should NOT load when service = { electricityPrice: 10 }, company = null, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = {
        electricityPrice: 10,
      }
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            amount: 12,
            lastAmount: 1,
            price: 10,
            sum: 110,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })

    it('should load when service = { electricityPrice: 10 }, company = { ... }, prevPayment = null', () => {
      const service: Partial<IService> = {
        electricityPrice: 10,
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
        type: ServiceType.Electricity,
        amount: 0,
        lastAmount: 0,
        price: 10,
        sum: 0,
      })
    })

    it('should load when service = { electricityPrice: 10 }, company = { ... }, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = {
        electricityPrice: 10,
      }
      const company: Partial<IRealestate> = {
        cleaning: 10,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            amount: 12,
            lastAmount: 1,
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

      expect(invoices).toContainEqual({
        type: ServiceType.Electricity,
        amount: 12,
        lastAmount: 12,
        price: 10,
        sum: 0,
      })
    })

    it('should load when service = { electricityPrice: 10 }, company = { ... }, prevPayment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = {
        electricityPrice: 10,
      }
      const company: Partial<IRealestate> = {
        cleaning: 10,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            amount: 12,
            lastAmount: 1,
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

      expect(invoices).toContainEqual({
        type: ServiceType.Electricity,
        amount: 0,
        lastAmount: 0,
        price: 10,
        sum: 0,
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
        expect.objectContaining({ type: ServiceType.Electricity})
      )
    })
    it('should load when service = null, company = null, payment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            amount: 12,
            lastAmount: 1,
            price: 10,
            sum: 10,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Electricity,
        amount: 12,
        lastAmount: 1,
        price: 10,
        sum: 10,
      })
    })
    it('should load when service = { rentPrice: 10 }, company = null, payment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            amount: 12,
            lastAmount: 1,
            price: 10,
            sum: 10,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Electricity,
        amount: 12,
        lastAmount: 1,
        price: 10,
        sum: 10,
      })
    })
  })
})