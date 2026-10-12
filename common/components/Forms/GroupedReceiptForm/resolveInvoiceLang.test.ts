import { resolveInvoiceLang } from './resolveInvoiceLang'

describe('resolveInvoiceLang', () => {
  it('honours an explicit invoiceLang over the currency', () => {
    expect(resolveInvoiceLang({ invoiceLang: 'uk', currency: 'USD' })).toBe(
      'uk'
    )
    expect(resolveInvoiceLang({ invoiceLang: 'en', currency: 'UAH' })).toBe(
      'en'
    )
  })

  it('falls back to English for non-UAH invoices', () => {
    expect(resolveInvoiceLang({ currency: 'USD' })).toBe('en')
    expect(resolveInvoiceLang({ currency: 'EUR' })).toBe('en')
  })

  it('normalizes the currency before deciding', () => {
    expect(resolveInvoiceLang({ currency: 'usd' })).toBe('en')
    expect(resolveInvoiceLang({ currency: 'uah' })).toBe('uk')
    // Unknown codes normalize to UAH, same as the preview.
    expect(resolveInvoiceLang({ currency: 'PLN' })).toBe('uk')
  })

  it('defaults to Ukrainian without any signal', () => {
    expect(resolveInvoiceLang({})).toBe('uk')
    expect(resolveInvoiceLang(null)).toBe('uk')
    expect(resolveInvoiceLang(undefined)).toBe('uk')
  })

  it('ignores an unusable invoiceLang value', () => {
    expect(
      resolveInvoiceLang({ invoiceLang: '' as 'en', currency: 'USD' })
    ).toBe('en')
    expect(resolveInvoiceLang({ invoiceLang: null, currency: 'UAH' })).toBe(
      'uk'
    )
  })
})
