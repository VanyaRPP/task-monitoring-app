import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - ELECTRICITY', () => {
  it('should load Electricity from payment', () => {
    const company: Partial<IRealestate> = {}
    const service: Partial<IService> = {}
    const payment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.Electricity,
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

  it('should load Electricity from company', () => {
    const company: Partial<IRealestate> = {}
    const service: Partial<IService> = {
      electricityPrice: 123,
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
      type: ServiceType.Electricity,
      amount: 0,
      lastAmount: 0,
      price: service.electricityPrice,
      sum: 0,
    })
  })

  it('should load Electricity with amount from company', () => {
    const company: Partial<IRealestate> = {}
    const service: Partial<IService> = {
      electricityPrice: 123,
    }
    const payment: Partial<IPayment> = {}
    const prevPayment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.Electricity,
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
      type: ServiceType.Electricity,
      amount: prevPayment.invoice[0].amount,
      lastAmount: prevPayment.invoice[0].amount,
      price: service.electricityPrice,
      sum: 0,
    })
  })

  it('should NOT load Electricity from service without electricity', () => {
    const company: Partial<IRealestate> = {}
    const service: Partial<IService> = {
      electricityPrice: null,
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
      expect.objectContaining({ type: ServiceType.Electricity })
    )
  })

  it('should NOT load Electricity from payment without electricity', () => {
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
      expect.objectContaining({ type: ServiceType.Electricity })
    )
  })

  it('should NOT load Electricity without props', () => {
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
      expect.objectContaining({ type: ServiceType.Electricity })
    )
  })
})
