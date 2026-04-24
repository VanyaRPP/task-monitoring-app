import { defaultServices } from '../constants'
import {
  filterServicesForDomainCatalogPicker,
  getCommunalUtilityServiceIds,
  getDomainInvoiceUiPolicy,
  getReservedPresetGroupNames,
  getStaticServicePresetForKind,
  normalizeDomainServiceKind,
  presetGroupsToFormValues,
  RESERVED_PRESET_GROUP_NAMES,
} from './domain-service-policy'

describe('domain-service-policy', () => {
  it('normalizeDomainServiceKind defaults to communal', () => {
    expect(normalizeDomainServiceKind(undefined)).toBe('communal')
    expect(normalizeDomainServiceKind('')).toBe('communal')
    expect(normalizeDomainServiceKind('unknown')).toBe('communal')
  })

  it('normalizeDomainServiceKind maps legacy own to custom', () => {
    expect(normalizeDomainServiceKind('own')).toBe('custom')
  })

  it('communal preset carries full utility id list', () => {
    const preset = getStaticServicePresetForKind('communal')
    expect(preset.groups).toHaveLength(1)
    expect(preset.groups[0].serviceIds).toEqual([...defaultServices])
  })

  it('IT preset is empty ids until catalog seed', () => {
    const preset = getStaticServicePresetForKind('it')
    expect(preset.groups[0].serviceIds).toEqual([])
    expect(preset.itCatalogSeedDisplayName).toBeTruthy()
  })

  it('only communal uses utility catalog policy', () => {
    expect(
      getDomainInvoiceUiPolicy('communal').usesCommunalUtilityCatalog
    ).toBe(true)
    expect(getDomainInvoiceUiPolicy('it').usesCommunalUtilityCatalog).toBe(
      false
    )
    expect(
      getDomainInvoiceUiPolicy('custom').usesCommunalUtilityCatalog
    ).toBe(false)
  })

  it('hides utility pickers for non-communal domains', () => {
    expect(
      getDomainInvoiceUiPolicy('communal').hideUtilityServicesInDomainPickers
    ).toBe(false)
    expect(
      getDomainInvoiceUiPolicy('it').hideUtilityServicesInDomainPickers
    ).toBe(true)
    expect(
      getDomainInvoiceUiPolicy('custom').hideUtilityServicesInDomainPickers
    ).toBe(true)
  })

  it('filterServicesForDomainCatalogPicker removes utility ids for IT', () => {
    const rows = [
      { _id: defaultServices[0], name: 'utility' },
      { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', name: 'other' },
    ]
    const filtered = filterServicesForDomainCatalogPicker(rows, 'it')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('other')
  })

  it('getCommunalUtilityServiceIds matches constants', () => {
    expect(getCommunalUtilityServiceIds()).toBe(defaultServices)
  })

  it('presetGroupsToFormValues mirrors preset service id lists', () => {
    const communal = presetGroupsToFormValues('communal')
    expect(communal).toHaveLength(1)
    expect(communal[0].services).toEqual([...defaultServices])
    const itForm = presetGroupsToFormValues('it')
    expect(itForm[0].services).toEqual([])
  })

  it('getReservedPresetGroupNames returns stable module set', () => {
    expect(getReservedPresetGroupNames()).toBe(RESERVED_PRESET_GROUP_NAMES)
  })
})
