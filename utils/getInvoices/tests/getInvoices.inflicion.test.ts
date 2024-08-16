import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - INFLICION', () => {
  describe('props: { service }', () => {
    it('should NOT load when service = null', () => {
      const service: Partial<IService> = null

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion})
      )
    })

    it('should NOT load when service = { inflicionPrice: 10 }', () => {
      const service: Partial<IService> = {
        inflicionPrice: 10,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion})
      )
    })

    it('should NOT load when service = { inflicionPrice: 0 }', () => {
      const service: Partial<IService> = {
        inflicionPrice: 0,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion})
      )
    })

    it('should NOT load when service = { inflicionPrice: NaN }', () => {
      const service: Partial<IService> = {
        inflicionPrice: NaN,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion})
      )
    })

    it('should NOT load when service = { inflicionPrice: null }', () => {
      const service: Partial<IService> = {
        inflicionPrice: null,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion})
      )
    })

    it('should NOT load when service = { inflicionPrice: undefined }', () => {
      const service: Partial<IService> = {
        inflicionPrice: undefined,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion})
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
        expect.objectContaining({ type: ServiceType.Inflicion})
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
        expect.objectContaining({ type: ServiceType.Inflicion})
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
        expect.objectContaining({ type: ServiceType.Inflicion})
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
        expect.objectContaining({ type: ServiceType.Inflicion})
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
        expect.objectContaining({ type: ServiceType.Inflicion})
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
        expect.objectContaining({ type: ServiceType.Inflicion})
      )
    })

    it('should NOT load when company = { inflicion: false }', () => {
      const company: Partial<IRealestate> = {
        inflicion: false,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion})
      )
    })

    it('should NOT load when company = { inflicion: true }', () => {
      const company: Partial<IRealestate> = {
        inflicion: true,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion})
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
        expect.objectContaining({ type: ServiceType.Inflicion})
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
        expect.objectContaining({ type: ServiceType.Inflicion})
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
        expect.objectContaining({ type: ServiceType.Inflicion})
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
        expect.objectContaining({ type: ServiceType.Inflicion})
      )
    })
    it('should load when payment = { invoice: [Inflicion] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
            price: 10,
            sum: 110,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Inflicion,
        price: 110,
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
        expect.objectContaining({ type: ServiceType.Inflicion})
      )
    })

    it('should NOT load when service = null, company = null, prevPayment = { invoice: [Inflicion] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
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
        expect.objectContaining({ type: ServiceType.Inflicion})
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
        expect.objectContaining({ type: ServiceType.Inflicion})
      )
    })

    it('should NOT load when service = { inflicionPrice: 10 }, company = null, prevPayment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = {
        inflicionPrice: 10,
      }
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
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
        expect.objectContaining({ type: ServiceType.Inflicion})
      )
    })

    it('should NOT load when service = { inflicionPrice: 10 }, company = null, prevPayment = { invoice: [Inflicion] }', () => {
      const service: Partial<IService> = {
        inflicionPrice: 10,
      }
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
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
        expect.objectContaining({ type: ServiceType.Inflicion})
      )
    })

    it('should load when service = { inflicionPrice: 110 }, company = { inflicion: true }, prevPayment = null', () => {
      const service: Partial<IService> = {
        inflicionPrice: 110,
      }
      const company: Partial<IRealestate> = {
        inflicion: true,
      }
      const prevPayment: Partial<IPayment> = null

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Inflicion,
        price: 0,
        sum: 0,
      })
    })

    it('should load when service = { inflicionPrice: 110 }, company = { inflicion: true }, prevPayment = { invoice: [Inflicion] }', () => {
      const service: Partial<IService> = {
        inflicionPrice: 110,
      }
      const company: Partial<IRealestate> = {
        inflicion: true,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
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
        type: ServiceType.Inflicion,
        price: 0,
        sum: 0,
      })
    })

    it('should load when service = { inflicionPrice: 110 }, company = { inflicion: true }, prevPayment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = {
        inflicionPrice: 110,
      }
      const company: Partial<IRealestate> = {
        inflicion: true,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
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

      expect(invoices).toContainEqual({
        type: ServiceType.Inflicion,
        price: 0,
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
        expect.objectContaining({ type: ServiceType.Inflicion})
      )
    })
    it('should load when service = null, company = null, payment = { invoice: [Inflicion] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
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
        type: ServiceType.Inflicion,
        price: 10,
        sum: 10,
      })
    })
    it('should load when service = { inflicionPrice: 10 }, company = null, payment = { invoice: [Inflicion] }', () => {
      const service: Partial<IService> = {
        inflicionPrice: 10,
      }
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
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
        type: ServiceType.Inflicion,
        price: 10,
        sum: 10,
      })
    })
  })
})
