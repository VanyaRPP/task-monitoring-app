import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - Placing', () => {
  describe('props: { service }', () => {
    it('should NOT load when service = null', () => {
      const service: Partial<IService> = null

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
      )
    })
    it('should NOT load when payment = { invoice: [Cleaning] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            amount: 100,
            price: 10,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Placing})
      )
    })
    it('should load when payment = { invoice: [Placing] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Placing,
            amount: 100,
            price: 10,
            sum: 110,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Placing,
        amount: 100,
        price: 10,
        sum: 110,
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
      )
    })

    it('should NOT load when service = null, company = { totalArea: 10, inflicion: true }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = {
        totalArea: 10,
        inflicion: true,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Placing})
      )
    })

    it('should load when service = { rentPrice: 10 }, company = { totalArea: 10, inflicion: false }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = {
        totalArea: 10,
        inflicion: true,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Placing,
        price: 100,
        sum: 100,
      })
    })

    it('should load when service = { rentPrice: 10 }, company = { totalArea: 10, inflicion: true }', () => {
      const service: Partial<IService> = {
        rentPrice: 15,
      }
      const company: Partial<IRealestate> = {
        totalArea: 12,
        inflicion: true,
      }

      const invoices = getInvoices({
        service,
        company,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Placing,
        price: 180,
        sum: 180,
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
        expect.objectContaining({ type: ServiceType.Placing})
      )
    })

    it('should NOT load when service = null, company = null, prevPayment = { invoice: [Inflicion] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Placing,
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
        expect.objectContaining({ type: ServiceType.Placing})
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
        expect.objectContaining({ type: ServiceType.Placing})
      )
    })

    it('should NOT load when service = { rentPrice: 10 }, company = null, prevPayment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
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
        expect.objectContaining({ type: ServiceType.Placing})
      )
    })

    it('should NOT load when service = { rentPrice: 10 }, company = null, prevPayment = { invoice: [Inflicion] }', () => {
      const service: Partial<IService> = {
        rentPrice: 10,
      }
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Placing,
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
        expect.objectContaining({ type: ServiceType.Placing})
      )
    })

    it('should load when service = { rentPrice: 110 }, company = { inflicion: true }, prevPayment = null', () => {
      const service: Partial<IService> = {
        rentPrice: 110,
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

      expect(invoices).toContainEqual(
        {
          type: ServiceType.Placing,
          price: 0,
          sum: 0,
        })
    })

    it('should load when service = { rentPrice: 110 }, company = { inflicion: true }, prevPayment = { invoice: [Placing] }', () => {
      const service: Partial<IService> = {
        rentPrice: 110,
      }
      const company: Partial<IRealestate> = {
        inflicion: true,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Placing,
            price: 10,
            sum: 17,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).toContainEqual(
        {
          type: ServiceType.Placing,
          price: 17,
          sum: 17,
        })
    })

    it('should load when service = { rentPrice: 110 }, company = { inflicion: true }, prevPayment = { invoice: [Cleaning] }', () => {
      const service: Partial<IService> = {
        rentPrice: 110,
      }
      const company: Partial<IRealestate> = {
        inflicion: true,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Cleaning,
            amount: 13,
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

      expect(invoices).toContainEqual(({
          type: ServiceType.Placing,
          price: 0,
          sum: 0,
        }))
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
        expect.objectContaining({ type: ServiceType.Placing})
      )
    })

    it('should NOT load when service = null, company = null, payment = { invoice: [Inflicion] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
            price: 15,
            sum: 11,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Placing})
      )
    })

    it('should load when service = null, company = null, payment = { invoice: [Placing] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Placing,
            amount: 17,
            price: 15,
            sum: 11,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Placing,
        amount: 17,
        price: 15,
        sum: 11,
      })
    })

    it('should load when service = { inflicionPrice: 10 }, company = null, payment = { invoice: [Placing] }', () => {
      const service: Partial<IService> = {
        inflicionPrice: 10,
      }
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Placing,
            amount: 17,
            price: 15,
            sum: 13,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Placing,
        amount: 17,
        price: 15,
        sum: 13,
      })
    })
  })

  describe('props: { service, company, prevService, prevPayment}', () => {
    it('should NOT load when service = null, company = null, prevService = null, prevPayment = null', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevService: Partial<IService> = null
      const prevPayment: Partial<IPayment> = null

      const invoices = getInvoices({
        service,
        company,
        prevService,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Placing})
      )
    })

    it('should NOT load when service = { rentPrice: 90 }, company = null, prevService = null, prevPayment = null', () => {
      const service: Partial<IService> = {
        rentPrice: 90,
      }
      const company: Partial<IRealestate> = null
      const prevService: Partial<IService> = null
      const prevPayment: Partial<IPayment> = null

      const invoices = getInvoices({
        service,
        company,
        prevService,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Placing})
      )
    })

    it('should load when service = { rentPrice: 90 }, company = { totalArea: 70 }, prevService = null, prevPayment = null', () => {
      const service: Partial<IService> = {
        rentPrice: 90,
      }
      const company: Partial<IRealestate> = {
        totalArea: 70,
      }
      const prevService: Partial<IService> = null
      const prevPayment: Partial<IPayment> = null

      const invoices = getInvoices({
        service,
        company,
        prevService,
        prevPayment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Placing,
        amount: 70,
        price: 90,
        sum: 90,
      })
    })

    it('should load when service = { rentPrice: 90 }, company = { inflicion: false, totalArea: 70 }, prevService = null, prevPayment = null', () => {
      const service: Partial<IService> = {
        rentPrice: 90,
      }
      const company: Partial<IRealestate> = {
        inflicion: false,
        totalArea: 70,
      }
      const prevService: Partial<IService> = null
      const prevPayment: Partial<IPayment> = null

      const invoices = getInvoices({
        service,
        company,
        prevService,
        prevPayment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Placing,
        amount: 70,
        price: 90,
        sum: 90,
      })
    })

    it('should load when service = { rentPrice: 90 }, company = { inflicion: true, totalArea: 70 }, prevService = null, prevPayment = null', () => {
      const service: Partial<IService> = {
        rentPrice: 90,
      }
      const company: Partial<IRealestate> = {
        inflicion: true,
        totalArea: 70,
      }
      const prevService: Partial<IService> = null
      const prevPayment: Partial<IPayment> = null

      const invoices = getInvoices({
        service,
        company,
        prevService,
        prevPayment,
      })

      expect(invoices).toContainEqual({
          type: ServiceType.Placing,
          price: 6300,
          sum: 6300,
        })
    })

    it('should load when service = { rentPrice: 90 }, company = { inflicion: true, totalArea: 70 }, prevService = { inflicionPrice: 110 } prevPayment = null', () => {
      const service: Partial<IService> = {
        rentPrice: 90,
      }
      const company: Partial<IRealestate> = {
        inflicion: true,
        totalArea: 70,
      }
      const prevService: Partial<IService> = {
        inflicionPrice: 110,
      }
      const prevPayment: Partial<IPayment> = null

      const invoices = getInvoices({
        service,
        company,
        prevService,
        prevPayment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Placing,
        price: 6930,
        sum: 6930,
      })
    })

    it('should load when service = { inflicionPrice: 110, rentPrice: 90 }, company = { inflicion: true, totalArea: 70 }, prevService = { inflicionPrice: 110 } prevPayment = { invoice: [Placing] }', () => {
      const service: Partial<IService> = {
        inflicionPrice: 110,
        rentPrice: 90,
      }
      const company: Partial<IRealestate> = {
        inflicion: true,
        totalArea: 70,
      }
      const prevService: Partial<IService> = {
        inflicionPrice: 110,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Placing,
            price: 630,
            sum: 630,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevService,
        prevPayment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Placing,
        price: 693,
        sum: 693,
      })
    })

    it('should load when service = { inflicionPrice: 110, rentPrice: 90 }, company = { inflicion: true, totalArea: 70 }, prevService = { inflicionPrice: 110 } prevPayment = { invoice: [Inflicion] }', () => {
      const service: Partial<IService> = {
        inflicionPrice: 110,
        rentPrice: 90,
      }
      const company: Partial<IRealestate> = {
        inflicion: true,
        totalArea: 70,
      }
      const prevService: Partial<IService> = {
        inflicionPrice: 110,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
            price: 630,
            sum: 630,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        company,
        prevService,
        prevPayment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Placing,
        price: 6930,
        sum: 6930,
      })
    })
  })
})
