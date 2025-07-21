
import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService, ICustomServices } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@common/services/invoicesService'

describe('getInvoices - ELECTRICITY', () => {
  describe('props: { service }', () => {
    it('should NOT load when service = null', () => {
      const service: Partial<IService> = null

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity })
      )
    })
    it('should NOT load when service = { electricityPrice: 100 }', () => {
      const service: Partial<IService> = {
        electricityPrice: 100,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity })
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
        expect.objectContaining({ type: ServiceType.Electricity })
      )
    })
    it('should NOT load when service = { waterPrice: NaN }', () => {
      const service: Partial<IService> = {
        electricityPrice: NaN,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity })
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
        expect.objectContaining({ type: ServiceType.Electricity })
      )
    })
    it('should NOT load when service = { waterPrice: undefined }', () => {
      const service: Partial<IService> = {
        electricityPrice: undefined,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity })
      )
    })
  })
  describe('props: { service}', () => {
    it('should NOT load when service = null,', () => {
      const service: Partial<IService> = null

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity })
      )
    })
    it('should NOT load when service = {electricityPrice: 10 }', () => {
      const service: Partial<IService> = { electricityPrice: 10 }
      const invoices = getInvoices({ service })
      expect(invoices).not.toContainEqual({
        type: ServiceType.Electricity,
        lastAmount: 0,
        amount: 0,
        price: 10,
        sum: 0,
      })
    })
  })

  describe('props: { service, prevPayment }', () => {
    it('should NOT load when service = null, prevPayment = null', () => {
      const service: Partial<IService> = null

      const prevPayment: Partial<IPayment> = null

      const invoices = getInvoices({
        service,

        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity })
      )
    })
    it('should NOT load when service = null, company = null, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = null
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
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity })
      )
    })
    it('should NOT load when service = { electricityPrice: 10 }, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = {
        electricityPrice: 10,
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
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity })
      )
    })
    it('should NOT load when service = { waterPrice: 10 }, company = null, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = {
        waterPrice: 10,
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
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when service = { electricityPrice: 10 },  prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = {
        electricityPrice: 10,
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
        company: null,
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity })
      )
    })
    it('should NOT load when service = { electricityPrice: 10 }, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = {
        electricityPrice: 10,
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
        prevPayment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity })
      )
    })
    it('should NOT load when service = { electricityPrice: 10 }, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = { electricityPrice: 10 }
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
      const invoices = getInvoices({ service, prevPayment })
      expect(invoices).not.toContainEqual({
        type: ServiceType.Electricity,
        amount: 10,
        lastAmount: 10,
        price: 10,
        sum: 0,
      })
    })
    it('should NOT load when service = null, payment = null', () => {
      const service: Partial<IService> = null
      const payment: Partial<IPayment> = null

      const invoices = getInvoices({
        service,
        payment,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity })
      )
    })
  })
  describe('props: { service, payment } with prio to payment', () => {
    it('should load when service = null, payment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 12,
            amount: 10,
            lastAmount: 0,
            sum: 120,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Electricity,
        price: 12,
        amount: 10,
        lastAmount: 0,
        sum: 120,
      })
    })

    it('should load when service = { electricityPrice: 10 }, payment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = {
        electricityPrice: 10,
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 12,
            amount: 10,
            lastAmount: 0,
            sum: 120,
          },
        ],
      }

      const invoices = getInvoices({
        service,
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Electricity,
        price: 12,
        amount: 10,
        lastAmount: 0,
        sum: 120,
      })
    })
    it('should load when service electricity entries and ignore others', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Water,
            price: 8,
            amount: 3,
            lastAmount: 1,
            sum: 24,
          },
          {
            type: ServiceType.Electricity,
            price: 9,
            amount: 4,
            lastAmount: 2,
            sum: 36,
          },
          {
            type: ServiceType.Water,
            price: 10,
            amount: 5,
            lastAmount: 2,
            sum: 50,
          },
        ],
      }

      const invoices = getInvoices({ service: null, payment })

      expect(invoices).toContainEqual({
        type: ServiceType.Electricity,
        price: 9,
        amount: 4,
        lastAmount: 2,
        sum: 36,
      })
      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
  })
  describe('props: { service, no payment } with customServices', () => {
    it('should NOT load when service.customServices.price is undefined', () => {
      const service: Partial<IService> = {
        customServices: [
          { fieldName: 'ElectricityPrice', price: undefined },
        ] as Partial<ICustomServices>[],
      } as Partial<IService>
      const invoices = getInvoices({ service, payment: null })
      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity })
      )
    })

    it('should NOT load when service.customServices.price is null', () => {
      const service: Partial<IService> = {
        customServices: [
          { fieldName: 'ElectricityPrice', price: null },
        ] as Partial<ICustomServices>[],
      } as Partial<IService>
      const invoices = getInvoices({ service, payment: null })
      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Electricity })
      )
    })
  })
  describe('props: { service.customServices, payment } override behavior', () => {
    it('should load from payment even if customServices.price = undefined', () => {
      const service: Partial<IService> = {
        customServices: [
          { fieldName: 'ElectricityPrice', price: undefined },
        ] as Partial<ICustomServices>[],
      } as Partial<IService>
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 55,
            amount: 5,
            lastAmount: 2,
            sum: 275,
          },
        ],
      }
      const invoices = getInvoices({ service, payment })
      expect(invoices).toContainEqual({
        type: ServiceType.Electricity,
        price: 55,
        amount: 5,
        lastAmount: 2,
        sum: 275,
      })
    })

    it('should load from payment even if customServices.price = null', () => {
      const service: Partial<IService> = {
        customServices: [
          { fieldName: 'ElectricityPrice', price: null },
        ] as Partial<ICustomServices>[],
      } as Partial<IService>
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 75,
            amount: 3,
            lastAmount: 1,
            sum: 225,
          },
        ],
      }
      const invoices = getInvoices({ service, payment })
      expect(invoices).toContainEqual({
        type: ServiceType.Electricity,
        price: 75,
        amount: 3,
        lastAmount: 1,
        sum: 225,
      })
    })
    it('should load from payment even if customServices.price = 0', () => {
      const service: Partial<IService> = {
        customServices: [
          { fieldName: 'ElectricityPrice', price: 0 },
        ] as Partial<ICustomServices>[],
      } as Partial<IService>
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 33,
            amount: 2,
            lastAmount: 1,
            sum: 66,
          },
        ],
      }
      const invoices = getInvoices({ service, payment })
      expect(invoices).toContainEqual({
        type: ServiceType.Electricity,
        price: 33,
        amount: 2,
        lastAmount: 1,
        sum: 66,
      })
    })

    it('should load from payment even if customServices.price = 100', () => {
      const service: Partial<IService> = {
        customServices: [
          { fieldName: 'ElectricityPrice', price: 100 },
        ] as Partial<ICustomServices>[],
      } as Partial<IService>
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 88,
            amount: 4,
            lastAmount: 0,
            sum: 352,
          },
        ],
      }
      const invoices = getInvoices({ service, payment })
      expect(invoices).toContainEqual({
        type: ServiceType.Electricity,
        price: 88,
        amount: 4,
        lastAmount: 0,
        sum: 352,
      })
    })
  })
  describe('props: { service, prevPayment, payment } priority & fallback', () => {
    it('should load from payment over prevPayment and service', () => {
      const service: Partial<IService> = { electricityPrice: 5 }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 6,
            amount: 1,
            lastAmount: 0,
            sum: 6,
          },
        ],
      }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 7,
            amount: 2,
            lastAmount: 1,
            sum: 14,
          },
        ],
      }

      const invoices = getInvoices({ service, prevPayment, payment })

      expect(invoices).toContainEqual({
        type: ServiceType.Electricity,
        price: 7,
        amount: 2,
        lastAmount: 1,
        sum: 14,
      })
    })

    it('should load from prevPayment.amount as lastAmount when no payment and no service price', () => {
      const service: Partial<IService> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 12,
            amount: 5,
            lastAmount: 2,
            sum: 60,
          },
        ],
      }

      const invoices = getInvoices({ service, prevPayment, payment: null })

      expect(invoices).toContainEqual({
        type: ServiceType.Electricity,
        price: 12,
        amount: 5,
        lastAmount: 5,
        sum: 0,
      })
    })
  })
}) 
    
