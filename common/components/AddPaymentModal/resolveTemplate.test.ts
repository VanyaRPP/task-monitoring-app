import { resolveTemplate } from './resolveTemplate'

describe('resolveTemplate', () => {
  it('returns payment template when all three are set', () => {
    expect(resolveTemplate('ledger', 'olimp', 'classic')).toBe('ledger')
  })

  it('returns company template when payment has none', () => {
    expect(resolveTemplate(undefined, 'olimp', 'classic')).toBe('olimp')
  })

  it('returns domain template when payment and company have none', () => {
    expect(resolveTemplate(undefined, undefined, 'ledger')).toBe('ledger')
  })

  it('falls back to classic when all are undefined', () => {
    expect(resolveTemplate(undefined, undefined, undefined)).toBe('classic')
  })

  it('payment template wins over company and domain', () => {
    expect(resolveTemplate('ledger', 'olimp', 'olimp')).toBe('ledger')
  })

  it('company template wins over domain', () => {
    expect(resolveTemplate(undefined, 'ledger', 'olimp')).toBe('ledger')
  })
})
