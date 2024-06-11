import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { IRealEstate } from '@common/modules/models/RealEstate'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - GARBAGE-COLLECTOR', () => {
  it('should load GarbageCollector from payment', () => {
    const company: Partial<IRealEstate> = {}
    const service: Partial<IService> = {}
    const payment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.GarbageCollector,
          lastAmount: 0,
          amount: 10,
          price: 100,
          sum: 100,
        },
      ],
    }
    const prevPayment: Partial<IPayment> = {}

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    expect(invoices).toContainEqual(payment.invoice[0])
  })

  it('should NOT load GarbageCollector from company without garbageCollector', () => {
    const company: Partial<IRealEstate> = {}
    const service: Partial<IService> = {
      garbageCollectorPrice: 123,
    }
    const payment: Partial<IPayment> = {}
    const prevPayment: Partial<IPayment> = {}

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    expect(invoices).not.toContainEqual(
      expect.objectContaining({ type: ServiceType.GarbageCollector })
    )
  })

  it('should load GarbageCollector from company with garbageCollector', () => {
    const company: Partial<IRealEstate> = {
      garbageCollector: true,
      servicePricePerMeter: 200,
    }
    const service: Partial<IService> = {
      garbageCollectorPrice: 123,
    }
    const payment: Partial<IPayment> = {}
    const prevPayment: Partial<IPayment> = {}

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    const targetPrice =
      (company.servicePricePerMeter * service.garbageCollectorPrice) / 100

    expect(invoices).toContainEqual({
      type: ServiceType.GarbageCollector,
      price: targetPrice,
      sum: targetPrice,
    })
  })

  it('should load GarbageCollector price from payment as sum', () => {
    const company: Partial<IRealEstate> = null
    const service: Partial<IService> = null
    const payment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.GarbageCollector,
          price: 0,
          sum: 110,
        },
      ],
    }
    const prevPayment: Partial<IPayment> = null

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    expect(invoices).toContainEqual({
      type: ServiceType.GarbageCollector,
      price: payment.invoice[0].sum,
      sum: payment.invoice[0].sum,
    })
  })

  it('should NOT load GarbageCollector from company without garbageCollector', () => {
    const company: Partial<IRealEstate> = {}
    const service: Partial<IService> = {
      garbageCollectorPrice: 123,
    }
    const payment: Partial<IPayment> = {}
    const prevPayment: Partial<IPayment> = {}

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    expect(invoices).not.toContainEqual(
      expect.objectContaining({ type: ServiceType.GarbageCollector })
    )
  })

  it('should NOT load GarbageCollector from payment without garbageCollector', () => {
    const company: Partial<IRealEstate> = null
    const service: Partial<IService> = null
    const payment: Partial<IPayment> = {
      invoice: [],
    }
    const prevPayment: Partial<IPayment> = null

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    expect(invoices).not.toContainEqual(
      expect.objectContaining({ type: ServiceType.GarbageCollector })
    )
  })

  it('should NOT load GarbageCollector without props', () => {
    const company: Partial<IRealEstate> = null
    const service: Partial<IService> = null
    const payment: Partial<IPayment> = null
    const prevPayment: Partial<IPayment> = null

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    expect(invoices).not.toContainEqual(
      expect.objectContaining({ type: ServiceType.GarbageCollector })
    )
  })
})
