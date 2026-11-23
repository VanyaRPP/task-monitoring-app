import {
  applyServiceAliases,
  resolveServiceAlias,
  shouldHideQuantityAndPrice,
  upsertServiceAlias,
} from './service-display'

const domain = {
  serviceAliases: [
    { serviceId: 'a1', alias: 'Освітня послуга' },
    { serviceId: 'p1', serviceType: 'placingPrice', alias: 'Навчання' },
  ],
}

describe('service-display', () => {
  it('matches a line by serviceId', () => {
    expect(
      resolveServiceAlias({ serviceId: 'a1', name: 'Оренда' }, domain)
    ).toBe('Освітня послуга')
  })

  it('falls back to the service type when the line has no serviceId', () => {
    expect(
      resolveServiceAlias({ type: 'placingPrice', name: 'Розміщення' }, domain)
    ).toBe('Навчання')
  })

  it('leaves lines without an alias untouched', () => {
    const lines = [{ serviceId: 'zzz', name: 'Вода', sum: 1 }]
    expect(applyServiceAliases(lines, domain)).toEqual(lines)
  })

  it('renames only aliased lines', () => {
    const out = applyServiceAliases(
      [
        { serviceId: 'a1', name: 'Оренда' },
        { serviceId: 'b', name: 'Вода' },
      ],
      domain
    )
    expect(out.map((l) => l.name)).toEqual(['Освітня послуга', 'Вода'])
  })

  it('upsert replaces, trims and removes on empty alias', () => {
    const one = upsertServiceAlias(domain.serviceAliases, {
      serviceId: 'a1',
      alias: '  Нова  ',
    })
    expect(one.find((a) => a.serviceId === 'a1')?.alias).toBe('Нова')
    const none = upsertServiceAlias(one, { serviceId: 'a1', alias: '' })
    expect(none.find((a) => a.serviceId === 'a1')).toBeUndefined()
  })

  it('hide flag is true only when explicitly set', () => {
    expect(shouldHideQuantityAndPrice({ hideQuantityAndPrice: true })).toBe(
      true
    )
    expect(shouldHideQuantityAndPrice({})).toBe(false)
    expect(shouldHideQuantityAndPrice(null)).toBe(false)
  })
})

describe('applyDomainDisplay', () => {
  const { applyDomainDisplay } = jest.requireActual('./service-display')

  it('adds alias without touching name, and the hide flag', () => {
    const out = applyDomainDisplay(
      { invoice: [{ serviceId: 'a1', name: 'Оренда' }] },
      { ...domain, hideQuantityAndPrice: true }
    )
    expect(out.invoice[0]).toEqual({
      serviceId: 'a1',
      name: 'Оренда',
      alias: 'Освітня послуга',
    })
    expect(out.hideQuantityAndPrice).toBe(true)
  })

  it('returns the same object when the domain has no settings', () => {
    const p = { invoice: [] }
    expect(applyDomainDisplay(p, {})).toBe(p)
  })
})

describe('resolveServiceAlias — lines without serviceId', () => {
  const d = {
    serviceAliases: [
      {
        serviceId: 'x',
        fieldName: 'orenda',
        serviceName: 'Оренда',
        alias: 'Освіта',
      },
    ],
  }
  it('matches by fieldName', () => {
    expect(resolveServiceAlias({ fieldName: 'orenda', name: 'щось' }, d)).toBe(
      'Освіта'
    )
  })
  it('matches by service name', () => {
    expect(resolveServiceAlias({ name: 'Оренда', type: 'custom' }, d)).toBe(
      'Освіта'
    )
  })
})
