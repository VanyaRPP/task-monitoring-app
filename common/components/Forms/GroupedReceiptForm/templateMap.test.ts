import { resolveBuiltinTemplateKey, templateMap } from './templateMap'

jest.mock('next/dynamic', () => () => () => null)

describe('resolveBuiltinTemplateKey', () => {
  it('returns the payment.template when it maps to a builtin', () => {
    expect(resolveBuiltinTemplateKey({ template: 'olimp' })).toBe('olimp')
    expect(resolveBuiltinTemplateKey({ template: 'ledger' })).toBe('ledger')
    expect(resolveBuiltinTemplateKey({ template: 'official' })).toBe('official')
    expect(resolveBuiltinTemplateKey({ template: 'classic' })).toBe('classic')
  })

  it('falls back to "classic" for unknown / not-yet-supported template keys', () => {
    expect(resolveBuiltinTemplateKey({ template: 'azure' })).toBe('classic')
    expect(resolveBuiltinTemplateKey({ template: 'monoline' })).toBe('classic')
    expect(resolveBuiltinTemplateKey({ template: 'totally-unknown' })).toBe(
      'classic'
    )
  })

  it('uses company.defaultTemplate when payment.template is missing', () => {
    expect(
      resolveBuiltinTemplateKey({ company: { defaultTemplate: 'olimp' } })
    ).toBe('olimp')
  })

  it('uses domain.defaultTemplate when payment + company values are missing', () => {
    expect(
      resolveBuiltinTemplateKey({
        company: {},
        domain: { defaultTemplate: 'ledger' },
      })
    ).toBe('ledger')
  })

  it('prefers payment.template over company / domain defaults', () => {
    expect(
      resolveBuiltinTemplateKey({
        template: 'official',
        company: { defaultTemplate: 'olimp' },
        domain: { defaultTemplate: 'ledger' },
      })
    ).toBe('official')
  })

  it('defaults to "classic" with no signals', () => {
    expect(resolveBuiltinTemplateKey({})).toBe('classic')
    expect(resolveBuiltinTemplateKey(null)).toBe('classic')
  })

  it('ignores non-object company / domain values', () => {
    expect(
      resolveBuiltinTemplateKey({
        company: 'company-id-string',
        domain: 'domain-id-string',
      })
    ).toBe('classic')
  })
})

describe('templateMap', () => {
  it('exposes exactly the four builtin template keys', () => {
    expect(Object.keys(templateMap).sort()).toEqual(
      ['classic', 'ledger', 'official', 'olimp'].sort()
    )
  })
})
