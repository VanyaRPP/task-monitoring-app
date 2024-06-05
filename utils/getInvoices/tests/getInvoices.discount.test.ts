import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { IRealEstate } from '@common/modules/models/RealEstate'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - DISCOUNT', () => {
  it('should load Discount from payment', () => {
    const company: Partial<IRealEstate> = {}
    const service: Partial<IService> = {}
    const payment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.Discount,
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

  it('should load Discount from company with discount', () => {
    const company: Partial<IRealEstate> = {
      discount: -3000,
    }
    const service: Partial<IService> = null
    const payment: Partial<IPayment> = null
    const prevPayment: Partial<IPayment> = null

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    expect(invoices).toContainEqual({
      type: ServiceType.Discount,
      price: company.discount,
      sum: company.discount,
    })
  })

  it('should load Discount price from payment as sum', () => {
    const company: Partial<IRealEstate> = null
    const service: Partial<IService> = null
    const payment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.Discount,
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
      type: ServiceType.Discount,
      price: payment.invoice[0].sum,
      sum: payment.invoice[0].sum,
    })
  })

  it('should NOT load Discount from company without discount', () => {
    const company: Partial<IRealEstate> = {}
    const service: Partial<IService> = {}
    const payment: Partial<IPayment> = {}
    const prevPayment: Partial<IPayment> = {}

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    expect(invoices).not.toContainEqual(
      expect.objectContaining({ type: ServiceType.Discount })
    )
  })

  it('should load Discount from company with discount', () => {
    const company: Partial<IRealEstate> = {
      discount: -3000,
    }
    const service: Partial<IService> = {}
    const payment: Partial<IPayment> = {}
    const prevPayment: Partial<IPayment> = {}

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    expect(invoices).toContainEqual({
      type: ServiceType.Discount,
      price: company.discount,
      sum: company.discount,
    })
  })
})
