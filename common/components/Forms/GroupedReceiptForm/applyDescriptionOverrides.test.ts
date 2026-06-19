import { applyDescriptionOverrides } from './applyDescriptionOverrides'

describe('applyDescriptionOverrides', () => {
  const data = {
    invoiceNumber: 1,
    provider: { description: 'base provider' },
    reciever: { description: 'base receiver', companyName: 'Acme' },
  }

  it('returns data unchanged when null', () => {
    expect(applyDescriptionOverrides(null)).toBeNull()
  })

  it('keeps base descriptions when no overrides provided', () => {
    const result = applyDescriptionOverrides(data)
    expect(result.provider.description).toBe('base provider')
    expect(result.reciever.description).toBe('base receiver')
  })

  it('applies provided overrides without dropping other fields', () => {
    const result = applyDescriptionOverrides(data, {
      providerDescription: 'new provider',
      receiverDescription: 'new receiver',
    })
    expect(result.provider.description).toBe('new provider')
    expect(result.reciever.description).toBe('new receiver')
    expect(result.reciever.companyName).toBe('Acme')
    expect(result.invoiceNumber).toBe(1)
  })

  it('keeps base when an override field is undefined', () => {
    const result = applyDescriptionOverrides(data, {
      providerDescription: 'only provider',
    })
    expect(result.provider.description).toBe('only provider')
    expect(result.reciever.description).toBe('base receiver')
  })
})
