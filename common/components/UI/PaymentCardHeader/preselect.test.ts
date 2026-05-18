import {
  resolvePreselectedDomain,
  resolvePreselectedCompany,
} from './preselect'

describe('resolvePreselectedDomain', () => {
  it('повертає домен з фільтра коли обраний рівно 1', () => {
    expect(resolvePreselectedDomain(['domain-1'], undefined)).toBe('domain-1')
  })

  it('повертає домен з domainFilter коли filterDomains порожній і domainFilter має 1 елемент', () => {
    expect(resolvePreselectedDomain(undefined, [{ value: 'domain-2' }])).toBe(
      'domain-2'
    )
  })

  it('повертає undefined коли filterDomains має більше 1', () => {
    expect(resolvePreselectedDomain(['d1', 'd2'], undefined)).toBeUndefined()
  })

  it('повертає undefined коли domainFilter має більше 1', () => {
    expect(
      resolvePreselectedDomain(undefined, [{ value: 'd1' }, { value: 'd2' }])
    ).toBeUndefined()
  })

  it('filterDomains має пріоритет над domainFilter', () => {
    expect(
      resolvePreselectedDomain(['domain-1'], [{ value: 'domain-2' }])
    ).toBe('domain-1')
  })

  it('повертає undefined коли обидва порожні', () => {
    expect(resolvePreselectedDomain(undefined, undefined)).toBeUndefined()
  })
})

describe('resolvePreselectedCompany', () => {
  it('повертає компанію з фільтра коли обрана рівно 1', () => {
    expect(resolvePreselectedCompany(['company-1'], undefined)).toBe(
      'company-1'
    )
  })

  it('повертає компанію з realEstatesFilter коли filterCompanies порожній і filter має 1 елемент', () => {
    expect(resolvePreselectedCompany(undefined, [{ value: 'company-2' }])).toBe(
      'company-2'
    )
  })

  it('повертає undefined коли filterCompanies має більше 1', () => {
    expect(resolvePreselectedCompany(['c1', 'c2'], undefined)).toBeUndefined()
  })

  it('повертає undefined коли realEstatesFilter має більше 1', () => {
    expect(
      resolvePreselectedCompany(undefined, [{ value: 'c1' }, { value: 'c2' }])
    ).toBeUndefined()
  })

  it('filterCompanies має пріоритет над realEstatesFilter', () => {
    expect(
      resolvePreselectedCompany(['company-1'], [{ value: 'company-2' }])
    ).toBe('company-1')
  })

  it('повертає undefined коли обидва порожні', () => {
    expect(resolvePreselectedCompany(undefined, undefined)).toBeUndefined()
  })
})

describe('преселект при виборі компанії (інтеграція)', () => {
  it('якщо обраний 1 домен — преселектиться тільки домен', () => {
    const domain = resolvePreselectedDomain(['domain-1'], undefined)
    const company = resolvePreselectedCompany(undefined, undefined)
    expect(domain).toBe('domain-1')
    expect(company).toBeUndefined()
  })

  it('якщо обрана 1 компанія і 1 домен — преселектяться обидва', () => {
    const domain = resolvePreselectedDomain(['domain-1'], undefined)
    const company = resolvePreselectedCompany(['company-1'], undefined)
    expect(domain).toBe('domain-1')
    expect(company).toBe('company-1')
  })

  it('якщо домен не вибраний — домен не преселектиться', () => {
    const domain = resolvePreselectedDomain([], undefined)
    expect(domain).toBeUndefined()
  })
})
