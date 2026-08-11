import { ServiceType } from '@utils/constants'
import {
  getAssignableServiceTypeOptions,
  getServiceTypeLabel,
  getServiceTypeOptionsForCategory,
  SERVICE_TYPES_BY_CATEGORY,
  UNDEFINED_SERVICE_TYPE_LABEL,
  UNDEFINED_SERVICE_TYPE_VALUE,
} from './service-type-categories'

describe('service-type-categories', () => {
  it('labels a known serviceType via ServiceName', () => {
    expect(getServiceTypeLabel(ServiceType.Electricity)).toBe(
      'Електропостачання'
    )
    expect(getServiceTypeLabel(ServiceType.GarbageCollector)).toBe('Вивіз ТПВ')
  })

  it('falls back to the raw value for an unmapped serviceType', () => {
    expect(getServiceTypeLabel('somethingElse')).toBe('somethingElse')
  })

  it('leads with "Невизначений" for the utility category', () => {
    const opts = getServiceTypeOptionsForCategory('utility')
    expect(opts[0]).toEqual({
      value: UNDEFINED_SERVICE_TYPE_VALUE,
      label: UNDEFINED_SERVICE_TYPE_LABEL,
    })
  })

  it('offers only communal serviceTypes for the utility category', () => {
    const values = getServiceTypeOptionsForCategory('utility')
      .map((o) => o.value)
      .filter((v) => v !== UNDEFINED_SERVICE_TYPE_VALUE)
    expect(values).toEqual(SERVICE_TYPES_BY_CATEGORY.utility)
    expect(values).toContain(ServiceType.Electricity)
    expect(values).not.toContain(ServiceType.Custom)
  })

  it('offers only "Невизначений" for categories with no own serviceTypes', () => {
    for (const category of ['it', 'edu', 'auto', 'real-estate', 'other']) {
      const opts = getServiceTypeOptionsForCategory(category)
      expect(opts).toEqual([
        {
          value: UNDEFINED_SERVICE_TYPE_VALUE,
          label: UNDEFINED_SERVICE_TYPE_LABEL,
        },
      ])
    }
  })

  it('getAssignableServiceTypeOptions offers all communal types regardless of category', () => {
    const opts = getAssignableServiceTypeOptions()
    expect(opts[0]).toEqual({
      value: UNDEFINED_SERVICE_TYPE_VALUE,
      label: UNDEFINED_SERVICE_TYPE_LABEL,
    })
    const values = opts
      .map((o) => o.value)
      .filter((v) => v !== UNDEFINED_SERVICE_TYPE_VALUE)
    expect(values).toEqual(
      expect.arrayContaining(SERVICE_TYPES_BY_CATEGORY.utility)
    )
    expect(values).toContain(ServiceType.Electricity)
    expect(values).not.toContain(ServiceType.Custom)
  })

  it('offers only "Невизначений" for an unknown or missing category', () => {
    expect(getServiceTypeOptionsForCategory(undefined)).toEqual([
      {
        value: UNDEFINED_SERVICE_TYPE_VALUE,
        label: UNDEFINED_SERVICE_TYPE_LABEL,
      },
    ])
    expect(getServiceTypeOptionsForCategory('nope')).toEqual([
      {
        value: UNDEFINED_SERVICE_TYPE_VALUE,
        label: UNDEFINED_SERVICE_TYPE_LABEL,
      },
    ])
  })
})
