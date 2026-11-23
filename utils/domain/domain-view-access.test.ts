import { Roles } from '@utils/constants'
import {
  DOMAIN_GENERAL_FIELDS,
  DOMAIN_GENERAL_PROJECTION,
  isDomainViewer,
} from './domain-view-access'

describe('isDomainViewer', () => {
  it('treats a plain User as a viewer', () => {
    expect(isDomainViewer([Roles.USER])).toBe(true)
  })

  it('treats an account with no roles as a viewer (fail closed)', () => {
    expect(isDomainViewer([])).toBe(true)
    expect(isDomainViewer(undefined)).toBe(true)
  })

  it('does not treat a DomainAdmin as a viewer', () => {
    expect(isDomainViewer([Roles.DOMAIN_ADMIN])).toBe(false)
  })

  it('does not treat a GlobalAdmin as a viewer', () => {
    expect(isDomainViewer([Roles.GLOBAL_ADMIN])).toBe(false)
  })
})

describe('DOMAIN_GENERAL_FIELDS', () => {
  it('covers exactly what the «Загальне» tab renders', () => {
    expect([...DOMAIN_GENERAL_FIELDS]).toEqual([
      '_id',
      'name',
      'adminEmails',
      'streets',
      'description',
      'iban',
      'rnokpp',
      'mfo',
    ])
  })

  it('never exposes bank tokens or other admin-only configuration', () => {
    const forbidden = [
      'domainBankToken',
      'domainServices',
      'customServices',
      'domainTypeTemplateId',
      'defaultTemplate',
      'archived',
    ]
    for (const field of forbidden) {
      expect(DOMAIN_GENERAL_FIELDS).not.toContain(field)
      expect(DOMAIN_GENERAL_PROJECTION.split(' ')).not.toContain(field)
    }
  })

  it('builds a space-separated mongoose projection', () => {
    expect(DOMAIN_GENERAL_PROJECTION).toBe(DOMAIN_GENERAL_FIELDS.join(' '))
  })
})
