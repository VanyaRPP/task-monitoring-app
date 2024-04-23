import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - WATER', () => {
  it('should load Water from payment', () => {
    const company: Partial<IRealestate> = null
    const service: Partial<IService> = null
    const payment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.Water,
          price: 100,
          sum: 100,
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

    expect(invoices).toContainEqual(payment.invoice[0])
  })

  it('should load Water from service', () => {
    const company: Partial<IRealestate> = {}
    const service: Partial<IService> = {
      waterPrice: 123,
    }
    const payment: Partial<IPayment> = {}
    const prevPayment: Partial<IPayment> = {}

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    expect(invoices).toContainEqual({
      type: ServiceType.Water,
      amount: 0,
      lastAmount: 0,
      price: service.waterPrice,
      sum: 0,
    })
  })

  it('should load Water with amount from service', () => {
    const company: Partial<IRealestate> = {}
    const service: Partial<IService> = {
      waterPrice: 123,
    }
    const payment: Partial<IPayment> = {}
    const prevPayment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.Water,
          amount: 12,
          lastAmount: 1,
          price: 10,
          sum: 110,
        },
      ],
    }

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    expect(invoices).toContainEqual({
      type: ServiceType.Water,
      amount: prevPayment.invoice[0].amount,
      lastAmount: prevPayment.invoice[0].amount,
      price: service.waterPrice,
      sum: 0,
    })
  })

  it('should load Water from payment when price = 0, sum = some_value', () => {
    const company: Partial<IRealestate> = null
    const service: Partial<IService> = null
    const payment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.Water,
          price: 0,
          sum: 100,
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
      type: ServiceType.Water,
      price: payment.invoice[0].sum,
      sum: payment.invoice[0].sum,
    })
  })

  it('should NOT load Water from service without water', () => {
    const company: Partial<IRealestate> = null
    const service: Partial<IService> = {
      waterPrice: null,
    }
    const payment: Partial<IPayment> = null
    const prevPayment: Partial<IPayment> = null

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    expect(invoices).not.toContainEqual(
      expect.objectContaining({ type: ServiceType.Water })
    )
  })

  it('should NOT load Water from payment without water', () => {
    const company: Partial<IRealestate> = null
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
      expect.objectContaining({ type: ServiceType.Water })
    )
  })

  it('should NOT load Water without props', () => {
    const company: Partial<IRealestate> = null
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
      expect.objectContaining({ type: ServiceType.Water })
    )
  })
})
