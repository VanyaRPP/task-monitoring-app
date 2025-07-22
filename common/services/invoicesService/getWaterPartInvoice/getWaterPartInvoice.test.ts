import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService, ICustomServices } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@common/services/invoicesService'

describe('getInvoices - WATER', () => {
  describe('props: { service }', () => {
    it('should NOT load when service = null', () => {
      const service: Partial<IService> = null

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when service = { waterPriceTotal: 10 }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when service = { waterPriceTotal: 0 }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 0,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when service = { waterPriceTotal: NaN }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: NaN,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when service = { waterPriceTotal: null }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: null,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when service = { waterPriceTotal: undefined }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: undefined,
      }

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
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
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when company = { waterPart: 10 }', () => {
      const company: Partial<IRealestate> = {
        waterPart: 10,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when company = { waterPart: 0 }', () => {
      const company: Partial<IRealestate> = {
        waterPart: 0,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when company = { waterPart: NaN }', () => {
      const company: Partial<IRealestate> = {
        waterPart: NaN,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when company = { waterPart: null }', () => {
      const company: Partial<IRealestate> = {
        waterPart: null,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when company = { waterPart: undefined }', () => {
      const company: Partial<IRealestate> = {
        waterPart: undefined,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
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
        expect.objectContaining({ type: ServiceType.Water })
      )
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
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

      expect(invoices).toContainEqual(
        expect.objectContaining({ type: ServiceType.WaterPart })
      )
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
        type: ServiceType.Water,
        price: 10,
        sum: 0,
      })
    })
    it('should NOT load when service = { waterPriceTotal: 10 }, company = { waterPart: 0 }', () => {
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

      expect(invoices).not.toContainEqual({
        type: ServiceType.Water,
        price: 10,
        sum: 0,
      })
    })
    it('should NOT load when service = { waterPriceTotal: 10 }, company = { waterPart: null }', () => {
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
        price: 10,
        sum: 0,
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
        type: ServiceType.Water,
        price: 10,
        sum: 0,
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
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when service = null, company = null, prevPayment = { invoice: [Water] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Water,
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when service = { waterPriceTotal: 10 }, company = null, prevPayment = { invoice: [Water] }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Water,
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when service = { waterPriceTotal: 10 }, company = { waterPart: 10 }, prevPayment = { invoice: [Water] }', () => {
      const service: Partial<IService> = {
        waterPriceTotal: 10,
      }
      const company: Partial<IRealestate> = {
        waterPart: 10,
      }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Water,
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should NOT load when service = { waterPriceTotal: 10 }, company = { waterPart: 10 }, prevPayment = { invoice: [Electricity] }', () => {
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

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Water })
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
        expect.objectContaining({ type: ServiceType.Water })
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
        expect.objectContaining({ type: ServiceType.Water })
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
        expect.objectContaining({ type: ServiceType.Water })
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
        expect.objectContaining({ type: ServiceType.Water })
      )
    })
    it('should load when payment = { invoice: [Water] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Water,
            amount: 10,
            lastAmount: 0,
            price: 10,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({
        payment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.Water,
        amount: 10,
        lastAmount: 0,
        price: 10,
        sum: 100,
      })
    })
    it('should load when payment = { invoice: [Water, WaterPart] }', () => {
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
        type: ServiceType.Water,
        amount: 10,
        lastAmount: 0,
        price: 10,
        sum: 100,
      })
    })
  })

  describe('props: { service, company, payment } with priority to payment', () => {
    const waterPartInvoice = {
      type: ServiceType.WaterPart,
      price: 120,
      sum: 120,
    }

    it('should NOT load WaterPart when payment is null or has no invoice', () => {
      const invoices = getInvoices({
        service: null,
        company: null,
        payment: null,
      })
      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.WaterPart })
      )

      const invoices2 = getInvoices({
        service: {},
        company: {},
        payment: { invoice: [] },
      })
      expect(invoices2).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.WaterPart })
      )
    })

    it('should load WaterPart exactly as in payment.invoice, regardless of service/company', () => {
      const combos: Array<{
        service: Partial<IService> | null
        company: Partial<IRealestate> | null
      }> = [
        { service: null, company: null },
        { service: { waterPriceTotal: 10 }, company: null },
        { service: null, company: { waterPart: 10 } },
        { service: { waterPriceTotal: 10 }, company: { waterPart: 10 } },
      ]

      for (const { service, company } of combos) {
        const invoices = getInvoices({
          service,
          company,
          payment: { invoice: [waterPartInvoice] },
        })

        expect(invoices).toContainEqual(waterPartInvoice)
      }
    })
  })
  describe('props: { service, company, prevPayment } with customServices', () => {
  it(
    'should load WaterPart from prevPayment when service = { customServices.waterPriceTotal: undefined }, company = { waterPart: 10 }, prevPayment = { invoice: [WaterPart] }',
    () => {
      const service: Partial<IService> = {
        customServices: [
          {
            label: 'Water',
            fieldName: ServiceType.Water,
            price: undefined,
          },
        ] as Partial<ICustomServices>[],
      } as Partial<IService>

      const company: Partial<IRealestate> = { waterPart: 10 }

      const prevPayment: Partial<IPayment> = {
        invoice: [{ type: ServiceType.WaterPart, price: 12, sum: 120 }],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 120,
        sum: 120,
      })
    }
  )

  it(
    'should load WaterPart from prevPayment when service = { customServices.waterPriceTotal: null }, company = { waterPart: 10 }, prevPayment = { invoice: [WaterPart] }',
    () => {
      const service: Partial<IService> = {
        customServices: [
          {
            label: 'Water',
            fieldName: ServiceType.Water,
            price: null,
          },
        ] as Partial<ICustomServices>[],
      } as Partial<IService>

      const company: Partial<IRealestate> = { waterPart: 10 }

      const prevPayment: Partial<IPayment> = {
        invoice: [{ type: ServiceType.WaterPart, price: 12, sum: 120 }],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 120,
        sum: 120,
      })
    }
  )

  it(
    'should load WaterPart from prevPayment when service = { customServices.waterPriceTotal: 0 }, company = { waterPart: 10 }, prevPayment = { invoice: [WaterPart] }',
    () => {
      const service: Partial<IService> = {
        customServices: [
          {
            label: 'Water',
            fieldName: ServiceType.Water,
            price: 0,
          },
        ] as Partial<ICustomServices>[],
      } as Partial<IService>

      const company: Partial<IRealestate> = { waterPart: 10 }

      const prevPayment: Partial<IPayment> = {
        invoice: [{ type: ServiceType.WaterPart, price: 0, sum: 0 }],
      }

      const invoices = getInvoices({
        service,
        company,
        prevPayment,
      })

      expect(invoices).toContainEqual({
        type: ServiceType.WaterPart,
        price: 0,
        sum: 0,
      })
    }
  )

  it(
    'should load WaterPart from prevPayment when service = { customServices.waterPriceTotal: 10 }, company = { waterPart: 10 }, prevPayment = { invoice: [WaterPart] }',
    () => {
      const service: Partial<IService> = {
        customServices: [
          {
            label: 'Water',
            fieldName: ServiceType.Water,
            price: 10,
          },
        ] as Partial<ICustomServices>[],
      } as Partial<IService>

      const company: Partial<IRealestate> = { waterPart: 10 }

      const prevPayment: Partial<IPayment> = {
        invoice: [{ type: ServiceType.WaterPart, price: 1, sum: 1 }],
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
    }
  )
})
it('should load WaterPart from currInvoicesCollection when present', () => {
  const service: Partial<IService> = { waterPriceTotal: 10 }
  const company: Partial<IRealestate> = { waterPart: 10 }

  const currInvoicesCollection = {
    [ServiceType.WaterPart]: {
      type: ServiceType.WaterPart,
      price: 50,
      sum: 50,
    },
  }

  const invoices = getInvoices({
    service,
    company,
    payment: {
      invoice: [currInvoicesCollection[ServiceType.WaterPart]],
    },
  })

  expect(invoices).toContainEqual({
    type: ServiceType.WaterPart,
    price: 50,
    sum: 50,
  })
})

it('should load WaterPart with 0 sum when company.waterPart is 0', () => {
  const service: Partial<IService> = { waterPriceTotal: 100 }
  const company: Partial<IRealestate> = { waterPart: 0 }

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

it('should NOT load WaterPart when service and company have no water data', () => {
  const service: Partial<IService> = {}
  const company: Partial<IRealestate> = {}

  const invoices = getInvoices({
    service,
    company,
  })

  expect(invoices).not.toContainEqual(
    expect.objectContaining({ type: ServiceType.WaterPart })
  )
})


})
