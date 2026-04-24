import type { ICustomDomainTypeTemplate } from '@common/api/domainApi/domain.api.types'
import {
  computeDomainTypeSelectValue,
  decodeDomainTypeSelectCustomValue,
  DOMAIN_TYPE_SELECT_CUSTOM_PREFIX,
  encodeDomainTypeSelectCustomValue,
  mergeDomainTypeSelectOptionsWithCustomValue,
  parseDomainTypeSelectChange,
} from '../domain-modal-type-select'

const templates: ICustomDomainTypeTemplate[] = [
  { _id: 't1', typeLabel: 'A', groupName: 'G' },
]

describe('domain-modal-type-select', () => {
  it('encode/decode round-trip', () => {
    const enc = encodeDomainTypeSelectCustomValue('Тип', 'Група')
    expect(enc.startsWith(DOMAIN_TYPE_SELECT_CUSTOM_PREFIX)).toBe(true)
    expect(decodeDomainTypeSelectCustomValue(enc)).toEqual({
      tl: 'Тип',
      gn: 'Група',
    })
  })

  it('computeDomainTypeSelectValue maps template match to tpl:id', () => {
    expect(
      computeDomainTypeSelectValue('own', 'A', 'G', templates)
    ).toBe('tpl:t1')
  })

  it('parseDomainTypeSelectChange', () => {
    expect(parseDomainTypeSelectChange('communal', [])).toEqual({
      kind: 'communal',
    })
    expect(parseDomainTypeSelectChange('own', [])).toEqual({
      kind: 'own_manual_empty',
    })
    const r = parseDomainTypeSelectChange('tpl:t1', templates)
    expect(r).toEqual({
      kind: 'own_from_template',
      typeLabel: 'A',
      groupName: 'G',
    })
  })

  it('mergeDomainTypeSelectOptionsWithCustomValue inserts custom row', () => {
    const base = [
      { value: 'communal', label: 'К' },
      { value: 'own', label: 'Вручну' },
    ]
    const v = encodeDomainTypeSelectCustomValue('X', 'Y')
    const merged = mergeDomainTypeSelectOptionsWithCustomValue(base, v)
    expect(merged.some((o) => o.value === v && o.label.includes('X'))).toBe(
      true
    )
  })
})
