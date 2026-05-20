import {
  getDomainHeading,
  getReceiverCompanyHeading,
  getBillFromHeadingAndBodyLines,
  getIssuedToHeadingAndBodyLines,
  getRecipientCompanyHeading,
} from './invoice-party-headings'

describe('getDomainHeading', () => {
  it('returns domain.name when present', () => {
    expect(getDomainHeading({ domain: { name: 'Acme Inc' } })).toBe('Acme Inc')
  })

  it('falls back to provided domainName when domain.name is missing', () => {
    expect(getDomainHeading({ domain: {} }, 'Fallback')).toBe('Fallback')
  })

  it('trims fallback domainName', () => {
    expect(getDomainHeading(undefined, '  Padded  ')).toBe('Padded')
  })

  it('returns empty string when nothing is provided', () => {
    expect(getDomainHeading(undefined)).toBe('')
    expect(getDomainHeading({})).toBe('')
    expect(getDomainHeading({ domain: null })).toBe('')
  })

  it('ignores domain when it is not an object', () => {
    expect(getDomainHeading({ domain: 'not-an-object' }, 'Fallback')).toBe(
      'Fallback'
    )
  })

  it('prefers structured domain.name over fallback', () => {
    expect(
      getDomainHeading({ domain: { name: 'Structured' } }, 'Fallback')
    ).toBe('Structured')
  })
})

describe('getReceiverCompanyHeading', () => {
  it('returns reciever.companyName when present', () => {
    expect(
      getReceiverCompanyHeading({ reciever: { companyName: 'Co Ltd' } })
    ).toBe('Co Ltd')
  })

  it('falls back to reciever.name when companyName missing', () => {
    expect(getReceiverCompanyHeading({ reciever: { name: 'Person' } })).toBe(
      'Person'
    )
  })

  it('trims surrounding whitespace', () => {
    expect(
      getReceiverCompanyHeading({ reciever: { companyName: '  Co  ' } })
    ).toBe('Co')
  })

  it('returns empty string when nothing is provided', () => {
    expect(getReceiverCompanyHeading({})).toBe('')
    expect(getReceiverCompanyHeading(undefined)).toBe('')
  })
})

describe('getBillFromHeadingAndBodyLines', () => {
  it('drops the first body line when it duplicates the heading', () => {
    const result = getBillFromHeadingAndBodyLines(
      { reciever: { companyName: 'Acme' } },
      ['Acme', '123 Main St', 'City']
    )
    expect(result.heading).toBe('Acme')
    expect(result.bodyLines).toEqual(['123 Main St', 'City'])
  })

  it('keeps body lines intact when first line is not a duplicate', () => {
    const result = getBillFromHeadingAndBodyLines(
      { reciever: { companyName: 'Acme' } },
      ['Other', '123 Main St']
    )
    expect(result.bodyLines).toEqual(['Other', '123 Main St'])
  })

  it('returns body lines unchanged when there is no heading', () => {
    const result = getBillFromHeadingAndBodyLines({}, ['Line1', 'Line2'])
    expect(result.heading).toBe('')
    expect(result.bodyLines).toEqual(['Line1', 'Line2'])
  })

  it('matches duplicates ignoring leading/trailing whitespace', () => {
    const result = getBillFromHeadingAndBodyLines(
      { reciever: { companyName: 'Acme' } },
      ['  Acme  ', 'rest']
    )
    expect(result.bodyLines).toEqual(['rest'])
  })

  it('handles an empty body lines array', () => {
    const result = getBillFromHeadingAndBodyLines(
      { reciever: { companyName: 'Acme' } },
      []
    )
    expect(result.heading).toBe('Acme')
    expect(result.bodyLines).toEqual([])
  })
})

describe('getIssuedToHeadingAndBodyLines', () => {
  it('drops first line when duplicating domain.name heading', () => {
    const result = getIssuedToHeadingAndBodyLines(
      { domain: { name: 'Acme' } },
      ['Acme', 'desc']
    )
    expect(result.heading).toBe('Acme')
    expect(result.bodyLines).toEqual(['desc'])
  })

  it('uses domainName fallback when domain.name is absent', () => {
    const result = getIssuedToHeadingAndBodyLines(
      {},
      ['Fallback', 'desc'],
      'Fallback'
    )
    expect(result.heading).toBe('Fallback')
    expect(result.bodyLines).toEqual(['desc'])
  })

  it('returns body lines unchanged when no heading is resolvable', () => {
    const result = getIssuedToHeadingAndBodyLines({}, ['line1', 'line2'])
    expect(result.heading).toBe('')
    expect(result.bodyLines).toEqual(['line1', 'line2'])
  })
})

describe('getRecipientCompanyHeading', () => {
  it('prefers reciever.companyName above all', () => {
    const data = {
      reciever: { companyName: 'A' },
      company: { companyName: 'B' },
      sender: { companyName: 'C' },
      client: { companyName: 'D' },
      issuedTo: { companyName: 'E' },
    }
    expect(getRecipientCompanyHeading(data, 'label')).toBe('A')
  })

  it('falls back to reciever.name when companyName absent', () => {
    expect(
      getRecipientCompanyHeading({ reciever: { name: 'PersonName' } })
    ).toBe('PersonName')
  })

  it('uses company.companyName when reciever data is missing', () => {
    expect(
      getRecipientCompanyHeading({ company: { companyName: 'Inc' } })
    ).toBe('Inc')
  })

  it('uses companyLabel argument before sender/client/issuedTo', () => {
    const data = {
      sender: { companyName: 'sender' },
      client: { companyName: 'client' },
      issuedTo: { companyName: 'issued' },
    }
    expect(getRecipientCompanyHeading(data, 'labelArg')).toBe('labelArg')
  })

  it('falls through sender → client → issuedTo when nothing else is set', () => {
    expect(
      getRecipientCompanyHeading({ sender: { companyName: 'sender' } })
    ).toBe('sender')
    expect(getRecipientCompanyHeading({ client: { name: 'clientName' } })).toBe(
      'clientName'
    )
    expect(
      getRecipientCompanyHeading({ issuedTo: { companyName: 'issued' } })
    ).toBe('issued')
  })

  it('skips company when it is not an object', () => {
    expect(
      getRecipientCompanyHeading(
        { company: 'not-object', sender: { name: 'sender' } },
        undefined
      )
    ).toBe('sender')
  })

  it('returns empty string when no source resolves', () => {
    expect(getRecipientCompanyHeading({})).toBe('')
    expect(getRecipientCompanyHeading(undefined)).toBe('')
  })

  it('trims whitespace from the resolved value', () => {
    expect(
      getRecipientCompanyHeading({ reciever: { companyName: '  Acme  ' } })
    ).toBe('Acme')
  })
})
