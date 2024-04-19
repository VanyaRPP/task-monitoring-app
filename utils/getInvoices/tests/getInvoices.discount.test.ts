import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - DISCOUNT', () => {
  it('should load Discount from payment', () => {
    const company: Partial<IRealestate> = {}
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

  it('should NOT load Discount from company without discount', () => {
    const company: Partial<IRealestate> = {}
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
    const company: Partial<IRealestate> = {
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
