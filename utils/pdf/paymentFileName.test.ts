import { buildInvoiceFileName } from './paymentFileName'

const basePayment = {
  invoiceNumber: 42,
  invoiceCreationDate: new Date('2026-03-15T12:00:00Z'),
  reciever: {
    companyName: 'Acme Corp',
    adminEmails: [],
    description: '',
  },
}

describe('buildInvoiceFileName', () => {
  it('defaults to invoice kind ("inv")', () => {
    expect(buildInvoiceFileName(basePayment as any)).toBe(
      'Acme Corp-inv-15032642'
    )
  })

  it('uses "act" for service acts', () => {
    expect(buildInvoiceFileName(basePayment as any, 'act')).toBe(
      'Acme Corp-act-15032642'
    )
  })

  it('uses "dov" for completion certificates (довідка)', () => {
    expect(buildInvoiceFileName(basePayment as any, 'dov')).toBe(
      'Acme Corp-dov-15032642'
    )
  })

  it('falls back to "invoice" when companyName is missing', () => {
    const payment = {
      ...basePayment,
      reciever: { ...basePayment.reciever, companyName: '' },
    }
    expect(buildInvoiceFileName(payment as any)).toBe('invoice-inv-15032642')
  })

  it('omits date prefix when invoiceCreationDate is invalid', () => {
    const payment = {
      ...basePayment,
      invoiceCreationDate: 'not-a-date' as unknown as Date,
    }
    expect(buildInvoiceFileName(payment as any)).toBe('Acme Corp-inv-42')
  })

  it('omits invoiceNumber portion when missing', () => {
    const payment = {
      ...basePayment,
      invoiceNumber: undefined as unknown as number,
    }
    expect(buildInvoiceFileName(payment as any)).toBe('Acme Corp-inv-150326')
  })

  it('strips characters that are invalid on common filesystems', () => {
    const payment = {
      ...basePayment,
      reciever: { ...basePayment.reciever, companyName: 'Acme/Corp:Inc?*' },
    }
    expect(buildInvoiceFileName(payment as any)).toBe(
      'AcmeCorpInc-inv-15032642'
    )
  })

  it('handles null payment gracefully', () => {
    expect(buildInvoiceFileName(null)).toBe('invoice-inv-')
  })
})
