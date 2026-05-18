import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import { Operations } from '@utils/constants'
import { buildCreditFromDebit } from './buildCreditFromDebit'

const baseSource: IExtendedPayment = {
  _id: 'payment-1',
  _v: 0,
  invoiceNumber: 10,
  type: Operations.Debit,
  domain: 'domain-1',
  street: 'street-1',
  company: 'company-1',
  monthService: 'service-1',
  invoiceCreationDate: new Date('2025-01-01'),
  generalSum: 500,
  provider: { description: 'Provider' },
  reciever: { companyName: 'Receiver', adminEmails: [], description: '' },
  invoice: [],
  transaction: {
    AUT_CNTR_ACC: 'UA123',
    AUT_CNTR_NAM: 'ТОВ Тест',
    AUT_CNTR_MFO: '322001',
    Description: 'Оплата за послуги',
  },
}

describe('buildCreditFromDebit', () => {
  it('sets type to Credit', () => {
    const result = buildCreditFromDebit(baseSource, 42)
    expect(result.type).toBe(Operations.Credit)
  })

  it('uses the provided invoice number', () => {
    const result = buildCreditFromDebit(baseSource, 99)
    expect(result.invoiceNumber).toBe(99)
  })

  it('copies generalSum, domain, street, company, provider, reciever from source', () => {
    const result = buildCreditFromDebit(baseSource, 1)
    expect(result.generalSum).toBe(500)
    expect(result.domain).toBe('domain-1')
    expect(result.street).toBe('street-1')
    expect(result.company).toBe('company-1')
    expect(result.provider).toBe(baseSource.provider)
    expect(result.reciever).toBe(baseSource.reciever)
  })

  it('sets invoiceCreationDate to current date', () => {
    const before = new Date()
    const result = buildCreditFromDebit(baseSource, 1)
    const after = new Date()
    expect(result.invoiceCreationDate.getTime()).toBeGreaterThanOrEqual(
      before.getTime()
    )
    expect(result.invoiceCreationDate.getTime()).toBeLessThanOrEqual(
      after.getTime()
    )
  })

  it('returns empty invoice array', () => {
    const result = buildCreditFromDebit(baseSource, 1)
    expect(result.invoice).toEqual([])
  })

  it('resolves monthService when it is a string', () => {
    const result = buildCreditFromDebit(
      { ...baseSource, monthService: 'ms-string' },
      1
    )
    expect(result.monthService).toBe('ms-string')
  })

  it('resolves monthService._id when it is an object', () => {
    const result = buildCreditFromDebit(
      { ...baseSource, monthService: { _id: 'ms-object-id' } as any },
      1
    )
    expect(result.monthService).toBe('ms-object-id')
  })

  it('uses transaction fields from source when present', () => {
    const result = buildCreditFromDebit(baseSource, 1)
    expect(result.transaction).toEqual({
      AUT_CNTR_ACC: 'UA123',
      AUT_CNTR_NAM: 'ТОВ Тест',
      AUT_CNTR_MFO: '322001',
      Description: 'Оплата за послуги',
    })
  })

  it('falls back to company fields when no transaction', () => {
    const source: IExtendedPayment = {
      ...baseSource,
      transaction: undefined,
      description: 'Опис',
      company: { companyName: 'Fallback Company', account: 'UA999' } as any,
    }
    const result = buildCreditFromDebit(source, 1)
    expect(result.transaction).toEqual({
      AUT_CNTR_ACC: 'UA999',
      AUT_CNTR_NAM: 'Fallback Company',
      AUT_CNTR_MFO: '',
      Description: 'Опис',
    })
  })

  it('uses empty strings when neither transaction nor company fields available', () => {
    const source: IExtendedPayment = {
      ...baseSource,
      transaction: undefined,
      description: undefined,
      company: 'company-id-string',
    }
    const result = buildCreditFromDebit(source, 1)
    expect(result.transaction).toEqual({
      AUT_CNTR_ACC: '',
      AUT_CNTR_NAM: '',
      AUT_CNTR_MFO: '',
      Description: '',
    })
  })
})
