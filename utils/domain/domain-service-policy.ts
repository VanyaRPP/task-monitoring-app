import {
  COMMUNAL_DEFAULT_SERVICE_GROUP_NAME,
  defaultServices,
  IT_DEFAULT_SERVICE_GROUP_NAME,
  IT_DEFAULT_SERVICE_NAME,
} from '../constants'

export type IDomainServiceKind = 'communal' | 'it' | 'custom'

export interface IDomainServicePresetGroup {
  groupName: string
  serviceIds: string[]
}

export interface IDomainStaticServicePreset {
  kind: IDomainServiceKind
  groups: IDomainServicePresetGroup[]
  itCatalogSeedDisplayName?: string
}

export interface IDomainInvoiceUiPolicy {
  usesCommunalUtilityCatalog: boolean
  hideUtilityServicesInDomainPickers: boolean
}

export interface IDomainCustomServiceFormGroup {
  groupName: string
  services: string[]
}

export const RESERVED_PRESET_GROUP_NAMES: ReadonlySet<string> = new Set([
  COMMUNAL_DEFAULT_SERVICE_GROUP_NAME,
  IT_DEFAULT_SERVICE_GROUP_NAME,
  'Стандартні послуги',
])

export function normalizeDomainServiceKind(
  raw?: string | null
): IDomainServiceKind {
  if (raw === 'own') return 'custom'
  if (raw === 'it') return 'it'
  if (raw === 'custom') return 'custom'
  return 'communal'
}

export function getReservedPresetGroupNames(): ReadonlySet<string> {
  return RESERVED_PRESET_GROUP_NAMES
}

export function presetGroupsToFormValues(
  kind: IDomainServiceKind
): IDomainCustomServiceFormGroup[] {
  const preset = getStaticServicePresetForKind(kind)
  return preset.groups.map((group) => ({
    groupName: group.groupName,
    services: [...group.serviceIds],
  }))
}

export function getCommunalUtilityServiceIds(): readonly string[] {
  return defaultServices
}

export function getStaticServicePresetForKind(
  kind: IDomainServiceKind
): IDomainStaticServicePreset {
  switch (kind) {
    case 'communal':
      return {
        kind,
        groups: [
          {
            groupName: COMMUNAL_DEFAULT_SERVICE_GROUP_NAME,
            serviceIds: [...defaultServices],
          },
        ],
      }
    case 'it':
      return {
        kind,
        groups: [
          {
            groupName: IT_DEFAULT_SERVICE_GROUP_NAME,
            serviceIds: [],
          },
        ],
        itCatalogSeedDisplayName: IT_DEFAULT_SERVICE_NAME,
      }
    case 'custom':
      return {
        kind,
        groups: [{ groupName: 'Мої послуги', serviceIds: [] }],
      }
  }
}

export function getDomainInvoiceUiPolicy(
  kind: IDomainServiceKind
): IDomainInvoiceUiPolicy {
  const communal = kind === 'communal'
  return {
    usesCommunalUtilityCatalog: communal,
    hideUtilityServicesInDomainPickers: !communal,
  }
}

export function filterServicesForDomainCatalogPicker<
  T extends { _id?: unknown },
>(services: T[], kind: IDomainServiceKind): T[] {
  if (!getDomainInvoiceUiPolicy(kind).hideUtilityServicesInDomainPickers) {
    return services
  }
  const utilitySet = new Set(getCommunalUtilityServiceIds().map(String))
  return services.filter(
    (s) => s._id != null && !utilitySet.has(String(s._id))
  )
}
