import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { IRealEstate } from '@common/modules/models/RealEstate'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - CLEANING', () => {
  it('should load Cleaning from payment', () => {
    const company: Partial<IRealEstate> = {}
    const service: Partial<IService> = {}
    const payment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.Cleaning,
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

  it('should load Cleaning from company with cleaning', () => {
    const company: Partial<IRealEstate> = {
      cleaning: 123,
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
      type: ServiceType.Cleaning,
      price: company.cleaning,
      sum: company.cleaning,
    })
  })

  it('should load Cleaning price from payment as sum', () => {
    const company: Partial<IRealEstate> = null
    const service: Partial<IService> = null
    const payment: Partial<IPayment> = {
      invoice: [{ type: ServiceType.Cleaning, price: 0, sum: 100 }],
    }
    const prevPayment: Partial<IPayment> = null

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    expect(invoices).toContainEqual({
      type: ServiceType.Cleaning,
      price: payment.invoice[0].sum,
      sum: payment.invoice[0].sum,
    })
  })

  it('should NOT load Cleaning from company without cleaning', () => {
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
      expect.objectContaining({ type: ServiceType.Cleaning })
    )
  })

  it('should load Cleaning from company with cleaning', () => {
    const company: Partial<IRealEstate> = {
      cleaning: 123,
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
      type: ServiceType.Cleaning,
      price: company.cleaning,
      sum: company.cleaning,
    })
  })
})
