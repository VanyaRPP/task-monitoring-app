import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService, ICustomServices } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@common/services/invoicesService'

describe('getInvoices - INFLICION', () => {
  describe('props: { service }', () => {
    it('should NOT load when service = null', () => {
      const service: Partial<IService> = null

      const invoices = getInvoices({
        service,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
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
        expect.objectContaining({ type: ServiceType.Inflicion })
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
        expect.objectContaining({ type: ServiceType.Inflicion })
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
        expect.objectContaining({ type: ServiceType.Inflicion })
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
        expect.objectContaining({ type: ServiceType.Inflicion })
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
        expect.objectContaining({ type: ServiceType.Inflicion })
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
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
    it('should NOT load when company = { pricePerMeter: 10 }', () => {
      const company: Partial<IRealestate> = {
        pricePerMeter: 10,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
    it('should NOT load when company = { pricePerMeter: 0 }', () => {
      const company: Partial<IRealestate> = {
        pricePerMeter: 0,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
    it('should NOT load when company = { pricePerMeter: NaN }', () => {
      const company: Partial<IRealestate> = {
        pricePerMeter: NaN,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
    it('should NOT load when company = { pricePerMeter: null }', () => {
      const company: Partial<IRealestate> = {
        pricePerMeter: null,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
    it('should NOT load when company = { pricePerMeter: undefined }', () => {
      const company: Partial<IRealestate> = {
        pricePerMeter: undefined,
      }

      const invoices = getInvoices({
        company,
      })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    }) 
    it('should NOT load when company = { servicePricePerMeter: 10 }', () => {
        const company: Partial<IRealestate> = {
            servicePricePerMeter: 10
        }
        const invoices = getInvoices({
            company 
          
      })
      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
    it('should NOT load when company = { servicePricePerMeter: 0 }', () => {
        const company: Partial<IRealestate> = {
            servicePricePerMeter: 0
        }
        const invoices = getInvoices({
            company
          
       })
      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
    it('should NOT load when company = { servicePricePerMeter: NaN }', () => {
        const company: Partial<IRealestate> = {
            servicePricePerMeter: NaN
        }
        const invoices = getInvoices({
            company
          
       })
      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
    it('should NOT load when company = { servicePricePerMeter: null }', () => {
        const company: Partial<IRealestate> = {
            servicePricePerMeter:
                null
        }
        const invoices = getInvoices({
            company
          
       })
      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
    it('should NOT load when company = { servicePricePerMeter: undefined }', () => {
        const company: Partial<IRealestate> = {
            servicePricePerMeter:
                undefined
        }
        const invoices = getInvoices({
            company 
          
      })
      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
  })

  describe('props: { service, company }', () => {
    it('should NOT load when service = null, company = null', () => {
        const service: Partial<IService> =
            null
        const company: Partial<IRealestate> =
            null

        const invoices = getInvoices({
            service,
            company
        })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })

    it('should NOT load when service = { inflicionPrice: 10 }, company = { inflicion: false }', () => {
        const service: Partial<IService> = {
            inflicionPrice: 10
          
       }
        const company: Partial<IRealestate> = {
            inflicion: false 
          
      }

        const invoices = getInvoices({
            service,
            company
        })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })

    it('should NOT load when service = { inflicionPrice: 10 }, company = null', () => {
        const service: Partial<IService> = {
            inflicionPrice:
                10
        }
        const company: Partial<IRealestate> = null
        

        const invoices = getInvoices({
            service,
            company
        })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })  
    it('should load when service.inflicionPrice = undefined, company = { inflicion: true }', () => {
      const service: Partial<IService> = { inflicionPrice: undefined }
      const company: Partial<IRealestate> = { inflicion: true }

      const invoices = getInvoices({ service, company })

      expect(invoices).toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })

    it('should load when service.inflicionPrice = NaN, company = { inflicion: true }', () => {
      const service: Partial<IService> = { inflicionPrice: NaN }
      const company: Partial<IRealestate> = { inflicion: true }

      const invoices = getInvoices({ service, company })

      expect(invoices).toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })

    it('should load when service.inflicionPrice = 0, company = { inflicion: true }', () => {
      const service: Partial<IService> = { inflicionPrice: 0 }
      const company: Partial<IRealestate> = { inflicion: true }

      const invoices = getInvoices({ service, company })

      expect(invoices).toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })

    it('should load when service.inflicionPrice = 10, company = { inflicion: true, totalArea: 0 }', () => {
      const service: Partial<IService> = { inflicionPrice: 10 }
      const company: Partial<IRealestate> = { inflicion: true, totalArea: 0 }

      const invoices = getInvoices({ service, company })

      expect(invoices).toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
  })  

  describe('props: { service, company, prevPayment }', () => {
    it('should NOT load when service = null, company = null, prevPayment = null', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = null

      const invoices = getInvoices({ service, company, payment: prevPayment })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })

    it('should NOT load when service = { inflicionPrice: 10 }, company = null, prevPayment = { invoice: [Electricity] }', () => {
      const service: Partial<IService> = { inflicionPrice: 10 }
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 20,
            amount: 2,
            lastAmount: 0,
            sum: 40,
          },
        ],
      }

      const invoices = getInvoices({ service, company, payment: prevPayment })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
    it('should load when service = null, company = null, prevPayment = { invoice: [Inflicion] }', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
            price: 10,
            amount: 5,
            lastAmount: 0,
            sum: 50,
          },
        ],
      }

      const invoices = getInvoices({ service, company, payment: prevPayment })

      expect(invoices).toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })

    it('should load when service = { inflicionPrice: 10 }, company = null, prevPayment = { invoice: [Inflicion] }', () => {
      const service: Partial<IService> = { inflicionPrice: 10 }
      const company: Partial<IRealestate> = null
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
            price: 10,
            amount: 5,
            lastAmount: 0,
            sum: 50,
          },
        ],
      }

      const invoices = getInvoices({ service, company, payment: prevPayment })

      expect(invoices).toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
  it('should load when service = { inflicionPrice: 10 }, company = { inflicion: false }, prevPayment = { invoice: [Inflicion] }', () => {
      const service: Partial<IService> = { inflicionPrice: 10 }
      const company: Partial<IRealestate> = { inflicion: false }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
            price: 10,
            amount: 5,
            lastAmount: 0,
            sum: 50,
          },
        ],
      }

      const invoices = getInvoices({ service, company, payment: prevPayment })

      expect(invoices).toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
    it('should load when service = { inflicionPrice: 10 }, company = { inflicion: true, totalArea: 8 }, prevPayment = { invoice: [Inflicion] }', () => {
      const service: Partial<IService> = { inflicionPrice: 10 }
      const company: Partial<IRealestate> = { inflicion: true, totalArea: 8 }
      const prevPayment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
            price: 15,
            amount: 2,
            lastAmount: 1,
            sum: 30,
          },
        ],
      }

      const invoices = getInvoices({ service, company, payment: prevPayment })

      expect(invoices).toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
  })
  describe('props: { payment }', () => {
    it('should NOT load when payment = null', () => {
      const payment: Partial<IPayment> = null

      const invoices = getInvoices({ payment })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })

    it('should NOT load when payment = { invoice: null }', () => {
      const payment: Partial<IPayment> = { invoice: null }

      const invoices = getInvoices({ payment })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })

    it('should NOT load when payment = { invoice: [] }', () => {
      const payment: Partial<IPayment> = { invoice: [] }

      const invoices = getInvoices({ payment })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })

    it('should NOT load when payment = { invoice: [Electricity] }', () => {
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Electricity,
            price: 10,
            sum: 10,
          },
        ],
      }

      const invoices = getInvoices({ payment })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
  })
  describe('props: { service, company, payment } with prio to payment', () => {
    it('should NOT load when service = null, company = null, payment = null', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = null

      const invoices = getInvoices({ service, company, payment })

      expect(invoices).not.toContainEqual(
        expect.objectContaining({ type: ServiceType.Inflicion })
      )
    })
    it('should NOT load when load service.inflicionPrice and company.inflicion when payment present', () => {
      const service: Partial<IService> = { inflicionPrice: 10 }
      const company: Partial<IRealestate> = { inflicion: true, totalArea: 2 }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
            price: 99,
            sum: 396,
          },
        ],
      }

      const invoices = getInvoices({ service, company, payment })

      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Inflicion,
          price: 396,
          sum: 396,
        })
      )
    })
    it('should load when payment.invoice includes Inflicion, even if service/company are null', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
            price: 50,
            sum: 100,
          },
        ],
      }

      const invoices = getInvoices({ service, company, payment })

      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Inflicion,
          price: 100,
          sum: 100,
        })
      )
    })

    it('should load when service.inflicionPrice = 20, company = null, payment.invoice includes Inflicion', () => {
      const service: Partial<IService> = { inflicionPrice: 20 }
      const company: Partial<IRealestate> = null
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
            price: 75,
            sum: 225,
          },
        ],
      }

      const invoices = getInvoices({ service, company, payment })


      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Inflicion,
          price: 225,
          sum: 225,
        })
      )
    })

    it('should load when service = null, company.inflicion = true, payment.invoice includes Inflicion', () => {
      const service: Partial<IService> = null
      const company: Partial<IRealestate> = { inflicion: true, totalArea: 5 }
      const payment: Partial<IPayment> = {
        invoice: [
          {
            type: ServiceType.Inflicion,
            price: 33,
            sum: 33,
          },
        ],
      }

      const invoices = getInvoices({ service, company, payment })

 
      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Inflicion,
          price: 33,
          sum: 33,
        })
      )
    })

   
  })
  describe('props: { service, company, payment } with customServices', () => {
    const commonArgs = {
      company: { inflicion: true } as Partial<IRealestate>,
      payment: {
        invoice: [
          {
            type: ServiceType.Inflicion,
            price: 20,
            sum: 40,
          },
        ],
      } as Partial<IPayment>,
    }

    it('should load when ignore customServices.price = undefined', () => {
      const service: Partial<IService> = {
        customServices: [
          {
            label: 'Inflicion',
            fieldName: ServiceType.Inflicion,
            price: undefined,
          },
        ] as Partial<ICustomServices>[],
      } as Partial<IService>

      const invoices = getInvoices({ service, ...commonArgs })

      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Inflicion,
          price: 40,
          sum: 40,
        })
      )
    })

    it('should load when ignore customServices.price = null', () => {
      const service: Partial<IService> = {
        customServices: [
          {
            label: 'Inflicion',
            fieldName: ServiceType.Inflicion,
            price: null,
          },
        ] as Partial<ICustomServices>[],
      } as Partial<IService>

      const invoices = getInvoices({ service, ...commonArgs })

      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Inflicion,
          price: 40,
          sum: 40,
        })
      )
    })

    it('should load when ignore customServices.price = 0', () => {
      const service: Partial<IService> = {
        customServices: [
          {
            label: 'Inflicion',
            fieldName: ServiceType.Inflicion,
            price: 0,
          },
        ] as Partial<ICustomServices>[],
      } as Partial<IService>

      const invoices = getInvoices({ service, ...commonArgs })

      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Inflicion,
          price: 40,
          sum: 40,
        })
      )
    })

    it('should load when ignore customServices.price = 10', () => {
      const service: Partial<IService> = {
        customServices: [
          {
            label: 'Inflicion',
            fieldName: ServiceType.Inflicion,
            price: 10,
          },
        ] as Partial<ICustomServices>[],
      } as Partial<IService>

      const invoices = getInvoices({ service, ...commonArgs })

      expect(invoices).toContainEqual(
        expect.objectContaining({
          type: ServiceType.Inflicion,
          price: 40,
          sum: 40,
        })
      )
    })
  })
})
