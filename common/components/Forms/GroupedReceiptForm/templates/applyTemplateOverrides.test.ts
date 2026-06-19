import {
  getLabel,
  pickLocalized,
  resolveTemplateChrome,
} from './applyTemplateOverrides'

describe('pickLocalized', () => {
  it('returns undefined when no text', () => {
    expect(pickLocalized(undefined, true)).toBeUndefined()
  })

  it('prefers the requested language', () => {
    expect(pickLocalized({ en: 'EN', uk: 'UK' }, true)).toBe('EN')
    expect(pickLocalized({ en: 'EN', uk: 'UK' }, false)).toBe('UK')
  })

  it('falls back to the other language when primary is missing', () => {
    expect(pickLocalized({ uk: 'UK' }, true)).toBe('UK')
    expect(pickLocalized({ en: 'EN' }, false)).toBe('EN')
  })
})

describe('resolveTemplateChrome', () => {
  it('returns empty defaults when no overrides', () => {
    expect(resolveTemplateChrome(undefined, true)).toEqual({
      accentColor: undefined,
      invoiceTitle: undefined,
      footerText: undefined,
    })
  })

  it('resolves localized title/footer by language and passes color', () => {
    const chrome = resolveTemplateChrome(
      {
        accentColor: '#ff0000',
        invoiceTitle: { en: 'INVOICE', uk: 'РАХУНОК' },
        footerText: { uk: 'Дякуємо' },
      },
      false
    )
    expect(chrome).toEqual({
      accentColor: '#ff0000',
      invoiceTitle: 'РАХУНОК',
      footerText: 'Дякуємо',
    })
  })
})

describe('getLabel', () => {
  it('falls back to default when no override', () => {
    expect(getLabel(undefined, 'provider.title', 'Постачальник', false)).toBe(
      'Постачальник'
    )
    expect(getLabel({ labels: {} }, 'provider.title', 'Provider', true)).toBe(
      'Provider'
    )
  })

  it('returns the localized override when present', () => {
    const overrides = {
      labels: { 'provider.title': { en: 'Vendor', uk: 'Виконавець' } },
    }
    expect(getLabel(overrides, 'provider.title', 'Provider', true)).toBe(
      'Vendor'
    )
    expect(getLabel(overrides, 'provider.title', 'Постачальник', false)).toBe(
      'Виконавець'
    )
  })
})
