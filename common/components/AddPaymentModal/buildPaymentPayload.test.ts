import dayjs from 'dayjs'
import {
  BuildPaymentFormData,
  buildPaymentPayload,
} from './buildPaymentPayload'
import { Currency } from '@utils/constants'

const baseInputs = () => {
  const formData: BuildPaymentFormData = {
    invoiceNumber: 100,
    operation: 'debit',
    domain: 'd1',
    street: 's1',
    company: 'c1',
    debit: 1,
    invoice: [
      { type: 'electricityPrice', price: 10, sum: 1000 },
      { type: 'maintenancePrice', price: 0, sum: 0 },
    ],
  }
  return {
    formData,
    monthServiceId: 'ms1',
    provider: { description: 'P' },
    reciever: { companyName: 'R' },
    transaction: { AUT_CNTR_ACC: '' },
    template: 'classic' as const,
  }
}

describe('buildPaymentPayload', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-05-08T16:15:15.000Z'))
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('passes through identifiers and metadata unchanged', () => {
    const inputs = baseInputs()
    const result = buildPaymentPayload(inputs)

    expect(result.invoiceNumber).toBe(100)
    expect(result.type).toBe('debit')
    expect(result.domain).toBe('d1')
    expect(result.street).toBe('s1')
    expect(result.company).toBe('c1')
    expect(result.monthService).toBe('ms1')
    expect(result.provider).toBe(inputs.provider)
    expect(result.reciever).toBe(inputs.reciever)
    expect(result.transaction).toBe(inputs.transaction)
    expect(result.template).toBe('classic')
  })

  it('description falls back to empty string when missing', () => {
    const result = buildPaymentPayload(baseInputs())
    expect(result.description).toBe('')
  })

  it('description is forwarded when provided', () => {
    const inputs = baseInputs()
    inputs.formData = { ...inputs.formData, description: 'note' }
    expect(buildPaymentPayload(inputs).description).toBe('note')
  })

  it('generalSum prefers formData.generalSum, falls back to formData.debit', () => {
    const a = baseInputs()
    a.formData = { ...a.formData, generalSum: 999 }
    expect(buildPaymentPayload(a).generalSum).toBe(999)

    const b = baseInputs()
    b.formData = { ...b.formData, generalSum: 0, debit: 7 }
    // generalSum=0 is falsy → falls back to debit (preserved historic behavior)
    expect(buildPaymentPayload(b).generalSum).toBe(7)
  })

  it('currency falls back to Currency.UAH', () => {
    expect(buildPaymentPayload(baseInputs()).currency).toBe(Currency.UAH)
  })

  it('currency is forwarded when provided', () => {
    const inputs = baseInputs()
    inputs.formData = { ...inputs.formData, currency: 'USD' }
    expect(buildPaymentPayload(inputs).currency).toBe('USD')
  })

  it('invoice: filters out items with sum=0 when debit is truthy', () => {
    const result = buildPaymentPayload(baseInputs())
    expect(result.invoice).toEqual([
      { type: 'electricityPrice', price: 10, sum: 1000 },
    ])
  })

  it('invoice: returns empty array when debit is falsy (credit/empty payment)', () => {
    const inputs = baseInputs()
    inputs.formData = { ...inputs.formData, debit: 0 }
    expect(buildPaymentPayload(inputs).invoice).toEqual([])
  })

  it('invoice: handles missing formData.invoice gracefully', () => {
    const inputs = baseInputs()
    inputs.formData = { ...inputs.formData, invoice: undefined as any }
    expect(buildPaymentPayload(inputs).invoice).toEqual([])
  })

  it('invoiceCreationDate: combines selected date with current time', () => {
    const inputs = baseInputs()
    inputs.formData = {
      ...inputs.formData,
      invoiceCreationDate: dayjs('2026-04-27'),
    }
    const result = buildPaymentPayload(inputs)
    expect(result.invoiceCreationDate.toISOString()).toBe(
      '2026-04-27T16:15:15.000Z'
    )
  })

  it('invoiceCreationDate: defaults to current Date when not provided', () => {
    const result = buildPaymentPayload(baseInputs())
    expect(result.invoiceCreationDate.toISOString()).toBe(
      '2026-05-08T16:15:15.000Z'
    )
  })

  it('invoiceLang: included in payload when set to uk', () => {
    const inputs = baseInputs()
    expect(buildPaymentPayload({ ...inputs, invoiceLang: 'uk' }).invoiceLang).toBe('uk')
  })

  it('invoiceLang: included in payload when set to en', () => {
    const inputs = baseInputs()
    expect(buildPaymentPayload({ ...inputs, invoiceLang: 'en' }).invoiceLang).toBe('en')
  })

  it('invoiceLang: undefined when not provided', () => {
    expect(buildPaymentPayload(baseInputs()).invoiceLang).toBeUndefined()
  })
})
