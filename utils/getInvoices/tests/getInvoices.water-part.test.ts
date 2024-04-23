import { IPayment } from '@common/api/paymentApi/payment.api.types'
import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { IService } from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { ServiceType } from '@utils/constants'
import { getInvoices } from '@utils/getInvoices'

describe('getInvoices - WATER-PART', () => {
  it('should load WaterPart from payment', () => {
    const company: Partial<IRealestate> = null
    const service: Partial<IService> = null
    const payment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.WaterPart,
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

  it('should load WaterPart from company with waterPart', () => {
    const company: Partial<IRealestate> = {
      waterPart: 20,
    }
    const service: Partial<IService> = {
      waterPrice: 123,
    }
    const payment: Partial<IPayment> = null
    const prevPayment: Partial<IPayment> = null

    const invoices = getInvoices({
      company,
      service,
      payment,
      prevPayment,
    })

    const targetPrice = (service.waterPrice * company.waterPart) / 100

    expect(invoices).toContainEqual({
      type: ServiceType.WaterPart,
      price: targetPrice,
      sum: targetPrice,
    })
  })

  it('should load WaterPart from payment when price = 0, sum = some_value', () => {
    const company: Partial<IRealestate> = null
    const service: Partial<IService> = null
    const payment: Partial<IPayment> = {
      invoice: [
        {
          type: ServiceType.WaterPart,
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
      type: ServiceType.WaterPart,
      price: payment.invoice[0].sum,
      sum: payment.invoice[0].sum,
    })
  })

  it('should NOT load WaterPart from company without waterPart', () => {
    const company: Partial<IRealestate> = null
    const service: Partial<IService> = {
      waterPrice: 123,
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
      expect.objectContaining({ type: ServiceType.WaterPart })
    )
  })

  it('should NOT load WaterPart from payment without waterPart', () => {
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
      expect.objectContaining({ type: ServiceType.WaterPart })
    )
  })

  it('should NOT load WaterPart without props', () => {
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
      expect.objectContaining({ type: ServiceType.WaterPart })
    )
  })
})
