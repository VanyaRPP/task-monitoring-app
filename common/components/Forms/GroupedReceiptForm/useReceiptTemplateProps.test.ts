/* eslint-disable react-hooks/rules-of-hooks */
import { useReceiptTemplateProps } from './useReceiptTemplateProps'

const basePayment = {
  invoiceNumber: 42,
  invoiceCreationDate: '2026-03-05T00:00:00.000Z',
  currency: 'UAH',
  invoice: [
    { type: 'maintenance', name: 'Service A', sum: 100 },
    { type: 'cleaning', name: 'Service B', sum: 50 },
  ],
  reciever: {
    companyName: 'Client Co',
    description: 'line one\nline two',
    adminEmails: ['admin@example.com'],
  },
  domain: {
    name: 'My Domain',
    description: 'Domain line one\nDomain line two',
  },
}

describe('useReceiptTemplateProps', () => {
  it('builds modernInvoiceNumber as DDMMYY prefix + invoiceNumber', () => {
    const props = useReceiptTemplateProps({ data: basePayment })
    expect(props.modernInvoiceNumber).toBe('05032642')
  })

  it('falls back to "" prefix when invoiceCreationDate is an invalid date', () => {
    const props = useReceiptTemplateProps({
      data: { ...basePayment, invoiceCreationDate: 'not-a-date' },
    })
    expect(props.modernInvoiceNumber).toBe('42')
  })

  it('returns isEnglish=false for UAH and true for USD', () => {
    expect(
      useReceiptTemplateProps({ data: { ...basePayment, currency: 'UAH' } })
        .isEnglish
    ).toBe(false)
    expect(
      useReceiptTemplateProps({ data: { ...basePayment, currency: 'USD' } })
        .isEnglish
    ).toBe(true)
  })

  it('resolves currency in priority order: data → data.company → contextCompany → data.domain', () => {
    expect(
      useReceiptTemplateProps({
        data: { ...basePayment, currency: 'USD', company: { currency: 'EUR' } },
      }).currency
    ).toBe('USD')
    expect(
      useReceiptTemplateProps({
        data: {
          ...basePayment,
          currency: undefined,
          company: { currency: 'EUR' },
        },
      }).currency
    ).toBe('EUR')
    expect(
      useReceiptTemplateProps({
        data: { ...basePayment, currency: undefined },
        contextCompany: { currency: 'USD' },
      }).currency
    ).toBe('USD')
    expect(
      useReceiptTemplateProps({
        data: {
          ...basePayment,
          currency: undefined,
          domain: { ...basePayment.domain, currency: 'EUR' },
        },
      }).currency
    ).toBe('EUR')
  })

  it('filters out invoice rows whose sum is zero', () => {
    const props = useReceiptTemplateProps({
      data: {
        ...basePayment,
        invoice: [
          { type: 'a', sum: 100 },
          { type: 'b', sum: 0 },
          { type: 'c', sum: 50 },
        ],
      },
    })
    expect(props.rows).toHaveLength(2)
    expect(props.rows.map((r: any) => r.type)).toEqual(['a', 'c'])
  })

  describe('getQty', () => {
    const { getQty } = useReceiptTemplateProps({ data: basePayment })

    it('returns amount - lastAmount when both are numbers', () => {
      expect(getQty({ amount: 10, lastAmount: 3 })).toBe(7)
    })

    it('returns amount when lastAmount is missing', () => {
      expect(getQty({ amount: 10 })).toBe(10)
    })

    it('returns 1 when amount is not a finite number', () => {
      expect(getQty({})).toBe(1)
      expect(getQty({ amount: 'NaN' })).toBe(1)
    })
  })

  it('computes subtotal as the sum of filtered rows', () => {
    const props = useReceiptTemplateProps({ data: basePayment })
    expect(props.subtotal).toBe(150)
    expect(props.total).toBe(150)
    expect(props.taxPercent).toBe(0)
    expect(props.taxAmount).toBe(0)
  })

  it('appends adminEmails to paymentInfoLines', () => {
    const props = useReceiptTemplateProps({ data: basePayment })
    expect(props.paymentInfoLines).toContain('admin@example.com')
  })

  it('does NOT prepend companyName line when receiver.companyName exists and no entrepreneur title', () => {
    const props = useReceiptTemplateProps({ data: basePayment })
    expect(props.paymentInfoLines[0]).toBe('line one')
  })

  it('prepends "Title CompanyName" when description starts with entrepreneur title', () => {
    const props = useReceiptTemplateProps({
      data: {
        ...basePayment,
        reciever: {
          ...basePayment.reciever,
          description: 'FOP\nsome detail',
        },
      },
    })
    expect(props.paymentInfoLines[0]).toBe('FOP Client Co')
  })

  it('separates bank details (after bank-trigger line) from paymentInfoLines', () => {
    const props = useReceiptTemplateProps({
      data: {
        ...basePayment,
        reciever: {
          ...basePayment.reciever,
          description:
            'Address line one\nAddress line two\nBank Name: Mono\nIBAN: UA00...',
          adminEmails: [],
        },
      },
    })
    expect(props.paymentInfoLines).toEqual(
      expect.arrayContaining(['Address line one', 'Address line two'])
    )
    expect(props.paymentInfoLines).not.toContain('IBAN: UA00...')
    expect(props.normalizedBankDetailsLines).toEqual(
      expect.arrayContaining(['Bank Name: Mono', 'IBAN: UA00...'])
    )
  })

  it('joins "Bank Address:" label with the following address line', () => {
    const props = useReceiptTemplateProps({
      data: {
        ...basePayment,
        reciever: {
          ...basePayment.reciever,
          description: 'Bank Name: Mono\nBank Address:\n1 Main St',
          adminEmails: [],
        },
      },
    })
    expect(props.normalizedBankDetailsLines).toContain(
      'Bank Address: 1 Main St'
    )
  })

  it('exposes overrides slot as undefined (constructor reserved field)', () => {
    const props = useReceiptTemplateProps({ data: basePayment })
    expect(props.overrides).toBeUndefined()
  })
})
