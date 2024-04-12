import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - PLACING', () => {
  it('should load Placing from payment', () => {
    const company: Partial<IRealestate> = {}
    const service: Partial<IService> = {}
    const payment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.Placing,
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

  it('should load Placing from company without inflicion', () => {
    const company: Partial<IRealestate> = {}
    const service: Partial<IService> = {}
    const payment: Partial<IPayment> = {}
    const prevPayment: Partial<IPayment> = {
      invoice: [{ type: ServiceType.Placing, price: 100, sum: 100 }],
    }

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    expect(invoices).toContainEqual({
      type: ServiceType.Placing,
      price: prevPayment.invoice[0].sum,
      sum: prevPayment.invoice[0].sum,
    })
  })

  it('should load Placing from company with inflicion', () => {
    const company: Partial<IRealestate> = {
      inflicion: true,
    }
    const service: Partial<IService> = {
      inflicionPrice: 101,
    }
    const payment: Partial<IPayment> = {}
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
      prevPayment.invoice[0].sum +
      ((service.inflicionPrice - 100) / 100) * prevPayment.invoice[0].sum

    expect(invoices).toContainEqual({
      type: ServiceType.Placing,
      price: targetPrice,
      sum: targetPrice,
    })
  })
})
