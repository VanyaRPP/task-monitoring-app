import { domainTypeTemplateToCustomServices } from './domain-type-template-services'

describe('domainTypeTemplateToCustomServices', () => {
  it('maps template groups to domain customServices', () => {
    const tpl = {
      groups: [
        { groupName: 'Стандартні', serviceIds: ['1', '2'] },
        { groupName: 'Додаткові', serviceIds: ['3'] },
      ],
    } as any

    expect(domainTypeTemplateToCustomServices(tpl)).toEqual([
      { groupName: 'Стандартні', services: ['1', '2'] },
      { groupName: 'Додаткові', services: ['3'] },
    ])
  })

  it('returns [] for null/undefined or no groups', () => {
    expect(domainTypeTemplateToCustomServices(null)).toEqual([])
    expect(domainTypeTemplateToCustomServices(undefined)).toEqual([])
    expect(domainTypeTemplateToCustomServices({ groups: [] } as any)).toEqual(
      []
    )
  })

  it('stringifies serviceIds', () => {
    const tpl = { groups: [{ groupName: 'A', serviceIds: [1, 2] }] } as any
    expect(domainTypeTemplateToCustomServices(tpl)).toEqual([
      { groupName: 'A', services: ['1', '2'] },
    ])
  })
})
