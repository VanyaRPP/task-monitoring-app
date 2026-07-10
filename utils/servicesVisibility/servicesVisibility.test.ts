import { Roles } from '@utils/constants'
import {
  canEditDomainServiceSelection,
  extractDomainsFromRealEstates,
  getSelectedServiceIds,
  getVisibleServices,
  isDomainAdmin,
  isGlobalAdmin,
  type IDomainForVisibility,
  type ICustomServiceItem,
} from '.'

const svc = (id: string, name = id): ICustomServiceItem => ({ _id: id, name })

const domain = (
  _id: string,
  groups: { groupName: string; services: string[] }[]
): IDomainForVisibility => ({ _id, customServices: groups })

describe('servicesVisibility — role helpers', () => {
  describe('isGlobalAdmin', () => {
    it('returns true only when role is present', () => {
      expect(isGlobalAdmin([Roles.GLOBAL_ADMIN])).toBe(true)
      expect(isGlobalAdmin([Roles.DOMAIN_ADMIN, Roles.GLOBAL_ADMIN])).toBe(true)
      expect(isGlobalAdmin([Roles.DOMAIN_ADMIN])).toBe(false)
      expect(isGlobalAdmin([Roles.USER])).toBe(false)
      expect(isGlobalAdmin([])).toBe(false)
      expect(isGlobalAdmin(undefined)).toBe(false)
    })
  })

  describe('isDomainAdmin', () => {
    it('returns true only when role is present', () => {
      expect(isDomainAdmin([Roles.DOMAIN_ADMIN])).toBe(true)
      expect(isDomainAdmin([Roles.USER])).toBe(false)
      expect(isDomainAdmin(undefined)).toBe(false)
    })
  })

  describe('canEditDomainServiceSelection', () => {
    it('only GlobalAdmin may edit selection', () => {
      expect(canEditDomainServiceSelection([Roles.GLOBAL_ADMIN])).toBe(true)
      expect(canEditDomainServiceSelection([Roles.DOMAIN_ADMIN])).toBe(false)
      expect(canEditDomainServiceSelection([Roles.USER])).toBe(false)
      expect(canEditDomainServiceSelection(undefined)).toBe(false)
    })
  })
})

describe('servicesVisibility — getSelectedServiceIds', () => {
  it('returns empty array for null/undefined/empty input', () => {
    expect(getSelectedServiceIds(null)).toEqual([])
    expect(getSelectedServiceIds(undefined)).toEqual([])
    expect(getSelectedServiceIds([])).toEqual([])
    expect(getSelectedServiceIds({ customServices: [] })).toEqual([])
  })

  it('flattens groups of a single domain', () => {
    const d = domain('d1', [
      { groupName: 'A', services: ['s1', 's2'] },
      { groupName: 'B', services: ['s3'] },
    ])
    expect(getSelectedServiceIds(d)).toEqual(['s1', 's2', 's3'])
  })

  it('deduplicates ids that appear in multiple groups', () => {
    const d = domain('d1', [
      { groupName: 'A', services: ['s1', 's2'] },
      { groupName: 'B', services: ['s2', 's3'] },
    ])
    expect(getSelectedServiceIds(d)).toEqual(['s1', 's2', 's3'])
  })

  it('handles missing groups/services arrays safely', () => {
    const d: IDomainForVisibility = {
      _id: 'd1',
      customServices: [
        { groupName: 'A', services: undefined as any },
        { groupName: 'B', services: ['s1'] },
      ],
    }
    expect(getSelectedServiceIds(d)).toEqual(['s1'])
  })

  it('returns union across multiple domains (multi-domain admin case)', () => {
    const d1 = domain('d1', [{ groupName: 'A', services: ['s1', 's2'] }])
    const d2 = domain('d2', [{ groupName: 'B', services: ['s2', 's3'] }])
    expect(getSelectedServiceIds([d1, d2])).toEqual(['s1', 's2', 's3'])
  })

  it('ignores nullish entries in array input', () => {
    const d1 = domain('d1', [{ groupName: 'A', services: ['s1'] }])
    expect(getSelectedServiceIds([d1, null as any, undefined as any])).toEqual([
      's1',
    ])
  })
})

describe('servicesVisibility — getVisibleServices', () => {
  const all = [svc('s1'), svc('s2'), svc('s3')]

  it('returns [] when there are no services regardless of role', () => {
    expect(getVisibleServices([Roles.GLOBAL_ADMIN], null, [])).toEqual([])
    expect(getVisibleServices([Roles.USER], null, [])).toEqual([])
  })

  it('GlobalAdmin sees every service even with no domain', () => {
    expect(getVisibleServices([Roles.GLOBAL_ADMIN], null, all)).toEqual(all)
    expect(getVisibleServices([Roles.GLOBAL_ADMIN], [], all)).toEqual(all)
  })

  it('GlobalAdmin is not constrained by domain.customServices', () => {
    const d = domain('d1', [{ groupName: 'A', services: ['s1'] }])
    expect(getVisibleServices([Roles.GLOBAL_ADMIN], d, all)).toEqual(all)
  })

  it('DomainAdmin without any domain sees nothing', () => {
    expect(getVisibleServices([Roles.DOMAIN_ADMIN], null, all)).toEqual([])
    expect(getVisibleServices([Roles.DOMAIN_ADMIN], [], all)).toEqual([])
  })

  it('DomainAdmin sees only services from his domain.customServices', () => {
    const d = domain('d1', [{ groupName: 'A', services: ['s2'] }])
    expect(getVisibleServices([Roles.DOMAIN_ADMIN], d, all)).toEqual([
      svc('s2'),
    ])
  })

  it('DomainAdmin in multiple domains sees the union of all customServices', () => {
    const d1 = domain('d1', [{ groupName: 'A', services: ['s1'] }])
    const d2 = domain('d2', [{ groupName: 'B', services: ['s3'] }])
    expect(getVisibleServices([Roles.DOMAIN_ADMIN], [d1, d2], all)).toEqual([
      svc('s1'),
      svc('s3'),
    ])
  })

  it('User sees only services configured on his domain (same path as DomainAdmin)', () => {
    const d = domain('d1', [{ groupName: 'A', services: ['s1', 's3'] }])
    expect(getVisibleServices([Roles.USER], d, all)).toEqual([
      svc('s1'),
      svc('s3'),
    ])
  })

  it('User with no domain configured sees nothing', () => {
    expect(getVisibleServices([Roles.USER], null, all)).toEqual([])
  })

  it('returns [] when allServices ids never match selected ids', () => {
    const d = domain('d1', [{ groupName: 'A', services: ['unknown'] }])
    expect(getVisibleServices([Roles.USER], d, all)).toEqual([])
  })

  it('treats undefined roles like a non-admin', () => {
    const d = domain('d1', [{ groupName: 'A', services: ['s1'] }])
    expect(getVisibleServices(undefined, d, all)).toEqual([svc('s1')])
    expect(getVisibleServices(undefined, null, all)).toEqual([])
  })
})

describe('servicesVisibility — extractDomainsFromRealEstates', () => {
  it('returns [] for null/undefined/empty input', () => {
    expect(extractDomainsFromRealEstates(null)).toEqual([])
    expect(extractDomainsFromRealEstates(undefined)).toEqual([])
    expect(extractDomainsFromRealEstates([])).toEqual([])
  })

  it('returns one entry per unique domain, preserving insertion order', () => {
    const d1 = domain('d1', [{ groupName: 'A', services: ['s1'] }])
    const d2 = domain('d2', [{ groupName: 'B', services: ['s2'] }])
    const realEstates = [{ domain: d1 }, { domain: d2 }, { domain: d1 }]
    expect(extractDomainsFromRealEstates(realEstates)).toEqual([d1, d2])
  })

  it('skips realEstates that have no domain', () => {
    const d1 = domain('d1', [])
    const realEstates = [
      { domain: null },
      { domain: undefined },
      { domain: d1 },
    ]
    expect(extractDomainsFromRealEstates(realEstates)).toEqual([d1])
  })

  it('keeps domains without an _id (will not be deduped)', () => {
    const d1: IDomainForVisibility = { customServices: [] }
    const d2: IDomainForVisibility = { customServices: [] }
    expect(
      extractDomainsFromRealEstates([{ domain: d1 }, { domain: d2 }])
    ).toEqual([d1, d2])
  })
})

describe('servicesVisibility — integration: Companies page scenarios', () => {
  const all = [
    svc('s1', 'Електрика'),
    svc('s2', 'Вода'),
    svc('s3', 'Інтернет'),
    svc('s4', 'Прибирання'),
  ]

  it('Filter for User: only services from his realestate domain are visible', () => {
    const d = domain('d1', [
      { groupName: 'Комунальні', services: ['s1', 's2'] },
    ])
    const realEstates = [{ domain: d }]

    const visibleDomains = extractDomainsFromRealEstates(realEstates)
    const visible = getVisibleServices([Roles.USER], visibleDomains, all)

    expect(visible.map((s) => s._id)).toEqual(['s1', 's2'])
    expect(visible.map((s) => s.name)).toEqual(['Електрика', 'Вода'])
  })

  it('Filter for DomainAdmin spanning two domains shows union', () => {
    const d1 = domain('d1', [{ groupName: 'A', services: ['s1'] }])
    const d2 = domain('d2', [{ groupName: 'B', services: ['s3', 's4'] }])
    const realEstates = [{ domain: d1 }, { domain: d2 }]

    const visibleDomains = extractDomainsFromRealEstates(realEstates)
    const visible = getVisibleServices(
      [Roles.DOMAIN_ADMIN],
      visibleDomains,
      all
    )

    expect(visible.map((s) => s._id).sort()).toEqual(['s1', 's3', 's4'])
  })

  it('Filter for User whose domain has empty customServices → empty filter', () => {
    const d = domain('d1', [])
    const realEstates = [{ domain: d }]
    const visibleDomains = extractDomainsFromRealEstates(realEstates)
    expect(getVisibleServices([Roles.USER], visibleDomains, all)).toEqual([])
  })

  it('Filter for User without realestates is empty', () => {
    const visibleDomains = extractDomainsFromRealEstates([])
    expect(getVisibleServices([Roles.USER], visibleDomains, all)).toEqual([])
  })

  it('GlobalAdmin sees all services regardless of realestate scope', () => {
    const visibleDomains = extractDomainsFromRealEstates([])
    expect(
      getVisibleServices([Roles.GLOBAL_ADMIN], visibleDomains, all)
    ).toEqual(all)
  })
})
