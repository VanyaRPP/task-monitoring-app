import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - INFLICION', () => {
  it('should load Inflicion from payment', () => {
    const company: Partial<IRealestate> = null
    const service: Partial<IService> = null
    const payment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.Inflicion,
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

  it('should load Inflicion from company with inflicion', () => {
    const company: Partial<IRealestate> = {
      inflicion: true,
    }
    const service: Partial<IService> = {
      inflicionPrice: 101,
    }
    const payment: Partial<IPayment> = null
    const prevPayment: Partial<IPayment> = {
      invoice: [{ type: ServiceType.Placing, price: 100, sum: 100 }],
    }

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    const targetPrice =
      ((service.inflicionPrice - 100) / 100) * prevPayment.invoice[0].sum

    expect(invoices).toContainEqual({
      type: ServiceType.Inflicion,
      price: targetPrice,
      sum: targetPrice,
    })
  })

  it('should load Inflicion from payment when price = 0, sum = some_value', () => {
    const company: Partial<IRealestate> = null
    const service: Partial<IService> = null
    const payment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.Inflicion,
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
      type: ServiceType.Inflicion,
      price: payment.invoice[0].sum,
      sum: payment.invoice[0].sum,
    })
  })

  it('should NOT load Inflicion from company without inflicion', () => {
    const company: Partial<IRealestate> = {
      inflicion: false,
    }
    const service: Partial<IService> = {
      inflicionPrice: 101,
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
      expect.objectContaining({ type: ServiceType.Inflicion })
    )
  })

  it('should NOT load Inflicion from payment without inflicion', () => {
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
      expect.objectContaining({ type: ServiceType.Inflicion })
    )
  })

  it('should NOT load Inflicion without props', () => {
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
      expect.objectContaining({ type: ServiceType.Inflicion })
    )
  })
})
