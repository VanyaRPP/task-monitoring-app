import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - CUSTOM', () => {
  it('should load Custom from payment', () => {
    const company: Partial<IRealestate> = {}
    const service: Partial<IService> = {}
    const payment: Partial<IPayment> = {
      invoice: [
        {
          name: 'Custom - 1',
          type: ServiceType.Custom,
          lastAmount: 0,
          amount: 10,
          price: 100,
          sum: 100,
        },
        {
          name: 'Custom - 2',
          type: ServiceType.Custom,
          lastAmount: 0,
          amount: 20,
          price: 200,
          sum: 200,
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

    expect(invoices).toEqual(expect.arrayContaining(payment.invoice))
  })

  it('should load Custom price from payment as sum', () => {
    const company: Partial<IRealestate> = null
    const service: Partial<IService> = null
    const payment: Partial<IPayment> = {
      invoice: [
        {
          name: 'Custom - 1',
          type: ServiceType.Custom,
          price: 0,
          sum: 100,
        },
        {
          name: 'Custom - 2',
          type: ServiceType.Custom,
          price: 0,
          sum: 200,
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

    expect(invoices).toEqual(
      expect.arrayContaining(
        payment.invoice.map((invoice) => ({
          ...invoice,
          price: invoice.sum,
        }))
      )
    )
  })

  it('should NOT load Custom without payment', () => {
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
      expect.objectContaining({ type: ServiceType.Custom })
    )
  })

  it('should NOT load Custom from payment without customs', () => {
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
      expect.objectContaining({ type: ServiceType.Custom })
    )
  })
})
