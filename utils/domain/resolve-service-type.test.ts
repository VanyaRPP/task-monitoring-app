import { defaultServices, ServiceType } from '../constants'
import { resolveServiceType } from './resolve-service-type'

describe('resolveServiceType', () => {
  it('prefers explicit serviceType field on the row', () => {
    const t = resolveServiceType({
      _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      serviceType: ServiceType.Electricity,
      fieldName: 'somethingElse',
    })
    expect(t).toBe(ServiceType.Electricity)
  })

  it('ignores invalid serviceType strings and falls through', () => {
    const id = defaultServices[0]
    const t = resolveServiceType({
      _id: id,
      serviceType: 'not-a-real-type',
    })
    expect(t).toBe(ServiceType.Maintenance)
  })

  it('treats serviceType=Custom as no explicit type (falls through)', () => {
    const id = defaultServices[0]
    const t = resolveServiceType({
      _id: id,
      serviceType: ServiceType.Custom,
    })
    expect(t).toBe(ServiceType.Maintenance)
  })

  it('falls back to UTILITY_SERVICE_ID_TO_TYPE when serviceType missing', () => {
    const id = defaultServices[1]
    const t = resolveServiceType({ _id: id })
    expect(t).toBe(ServiceType.Electricity)
  })

  it('falls back to fieldName matching ServiceType enum', () => {
    const t = resolveServiceType({
      _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      fieldName: 'waterPrice',
    })
    expect(t).toBe(ServiceType.Water)
  })

  it('returns null when nothing matches', () => {
    const t = resolveServiceType({
      _id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
      fieldName: 'nonsenseField',
    })
    expect(t).toBeNull()
  })

  it('returns null for empty input', () => {
    expect(resolveServiceType({})).toBeNull()
  })
})
