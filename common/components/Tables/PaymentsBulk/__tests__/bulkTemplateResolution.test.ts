import { resolveTemplate } from '@common/components/AddPaymentModal/resolveTemplate'

describe('bulk vs single template resolution', () => {
  it('falls back to the domain default when the company has none', () => {
    const company = { defaultTemplate: undefined } as any
    const domain = { defaultTemplate: 'ledger' } as any

    const single = resolveTemplate(
      undefined,
      company.defaultTemplate,
      domain.defaultTemplate
    )
    const bulk = resolveTemplate(
      undefined,
      company.defaultTemplate,
      domain.defaultTemplate
    )

    expect(bulk).toBe('ledger')
    expect(bulk).toBe(single)
  })

  it('prefers the company default over the domain default', () => {
    const company = { defaultTemplate: 'olimp' } as any
    const domain = { defaultTemplate: 'ledger' } as any

    expect(
      resolveTemplate(
        undefined,
        company.defaultTemplate,
        domain.defaultTemplate
      )
    ).toBe('olimp')
  })

  it('regression: bulk does not silently fall back to "classic" when the domain has a default', () => {
    const company = { defaultTemplate: undefined } as any
    const domain = { defaultTemplate: 'ledger' } as any

    expect(
      resolveTemplate(
        undefined,
        company.defaultTemplate,
        domain.defaultTemplate
      )
    ).not.toBe('classic')
  })
})
