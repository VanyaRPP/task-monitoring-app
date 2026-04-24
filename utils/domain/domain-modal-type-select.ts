import type { ICustomDomainTypeTemplate } from '@common/api/domainApi/domain.api.types'

export const DOMAIN_TYPE_SELECT_CUSTOM_PREFIX = 'custom:'

export function encodeDomainTypeSelectCustomValue(
  typeLabel: string,
  groupName: string
): string {
  return `${DOMAIN_TYPE_SELECT_CUSTOM_PREFIX}${encodeURIComponent(typeLabel)}|${encodeURIComponent(groupName)}`
}

export function decodeDomainTypeSelectCustomValue(
  v: string
): { tl: string; gn: string } | null {
  if (!v.startsWith(DOMAIN_TYPE_SELECT_CUSTOM_PREFIX)) return null
  const rest = v.slice(DOMAIN_TYPE_SELECT_CUSTOM_PREFIX.length)
  const pipe = rest.indexOf('|')
  try {
    if (pipe === -1) {
      return { tl: decodeURIComponent(rest), gn: '' }
    }
    return {
      tl: decodeURIComponent(rest.slice(0, pipe)),
      gn: decodeURIComponent(rest.slice(pipe + 1)),
    }
  } catch {
    return null
  }
}

export function computeDomainTypeSelectValue(
  domainType: string | undefined,
  typeLabel: string | undefined,
  groupName: string | undefined,
  templates: ICustomDomainTypeTemplate[]
): string {
  if (domainType !== 'own') return domainType || 'communal'
  const tl = typeLabel?.trim() ?? ''
  const gn = groupName?.trim() ?? ''
  const match = templates.find(
    (t) => t.typeLabel === tl && t.groupName === gn
  )
  if (match) return `tpl:${match._id}`
  if (!tl && !gn) return 'own'
  return encodeDomainTypeSelectCustomValue(tl, gn)
}

export interface IDomainTypeSelectOption {
  value: string
  label: string
}

export function buildDomainTypeSelectBaseOptions(
  templates: ICustomDomainTypeTemplate[]
): IDomainTypeSelectOption[] {
  return [
    { value: 'communal', label: 'Комунальні' },
    { value: 'it', label: 'IT' },
    ...templates.map((t) => ({
      value: `tpl:${t._id}`,
      label: t.groupName ? `${t.typeLabel} — ${t.groupName}` : t.typeLabel,
    })),
    { value: 'own', label: 'Інший тип (ввести вручну)' },
  ]
}

export function mergeDomainTypeSelectOptionsWithCustomValue(
  baseOptions: IDomainTypeSelectOption[],
  selectValue: string
): IDomainTypeSelectOption[] {
  if (!selectValue.startsWith(DOMAIN_TYPE_SELECT_CUSTOM_PREFIX)) {
    return baseOptions
  }
  const decoded = decodeDomainTypeSelectCustomValue(selectValue)
  const label = decoded
    ? decoded.tl
      ? decoded.gn
        ? `${decoded.tl} — ${decoded.gn}`
        : decoded.tl
      : decoded.gn || 'Власний тип'
    : 'Власний тип'
  const idx = baseOptions.findIndex((o) => o.value === 'own')
  const next = [...baseOptions]
  next.splice(Math.max(0, idx), 0, { value: selectValue, label })
  return next
}

export type IServiceTypeSelectChangeResult =
  | { kind: 'communal' | 'it' }
  | { kind: 'own_manual_empty' }
  | {
      kind: 'own_from_template'
      typeLabel: string
      groupName: string
    }
  | {
      kind: 'own_from_custom_encoded'
      typeLabel: string
      groupName: string
    }

export function parseDomainTypeSelectChange(
  v: string,
  templates: ICustomDomainTypeTemplate[]
): IServiceTypeSelectChangeResult | null {
  if (v === 'communal' || v === 'it') {
    return { kind: v }
  }
  if (v === 'own') {
    return { kind: 'own_manual_empty' }
  }
  if (v.startsWith('tpl:')) {
    const id = v.slice(4)
    const t = templates.find((x) => String(x._id) === id)
    if (!t) return null
    return {
      kind: 'own_from_template',
      typeLabel: t.typeLabel,
      groupName: t.groupName,
    }
  }
  if (v.startsWith(DOMAIN_TYPE_SELECT_CUSTOM_PREFIX)) {
    const d = decodeDomainTypeSelectCustomValue(v)
    if (!d) return null
    return {
      kind: 'own_from_custom_encoded',
      typeLabel: d.tl,
      groupName: d.gn,
    }
  }
  return null
}
