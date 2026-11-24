import { expect } from '@jest/globals'
import domainHandler from '../[id]'
import domainsHandler from '../index'

import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import DomainTypeTemplate, {
  type DomainTypeTemplateCategory,
} from '@modules/models/domain-type-template'
import { findDomainIdsByServiceType } from '@utils/domain/domains-by-service-type'
import { ServiceType } from '@utils/constants'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

const domainA = domains[0]._id

const createMockResponse = () => {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  } as any
  return res
}

const patchDomain = async (body: Record<string, unknown>) => {
  await mockLoginAs(users.globalAdmin)
  const res = createMockResponse()
  await domainHandler(
    { method: 'PATCH', query: { id: domainA }, body } as any,
    res
  )
  expect(res.status).toHaveBeenCalledWith(200)
  return res.json.mock.calls[0][0].data
}

const createTemplate = async (category: DomainTypeTemplateCategory) => {
  const template = await DomainTypeTemplate.create({
    name: `Шаблон ${category}`,
    category,
  })
  return String(template._id)
}

const housingFeeServices = () =>
  CustomService.find({
    domain: domainA,
    serviceType: ServiceType.HousingFee,
  }).lean()

beforeEach(async () => {
  await Domain.updateOne({ _id: domainA }, { customServices: [] })
})

describe('housing-fee service for the «Нерухомість» category', () => {
  it('is created and attached when a domain is switched to a real-estate template', async () => {
    const templateId = await createTemplate('real-estate')

    const saved = await patchDomain({ domainTypeTemplateId: templateId })

    const [service] = await housingFeeServices()
    expect(service).toBeDefined()
    expect(saved.customServices).toEqual([
      expect.objectContaining({
        groupName: 'Квартплата',
        services: [String(service._id)],
      }),
    ])
    // That is what opens the debt calculation page for the domain.
    expect(await findDomainIdsByServiceType(ServiceType.HousingFee)).toContain(
      String(domainA)
    )
  })

  it('puts it into an existing «Квартплата» group instead of adding a second one', async () => {
    const templateId = await createTemplate('real-estate')

    const saved = await patchDomain({
      domainTypeTemplateId: templateId,
      customServices: [{ groupName: 'Квартплата', services: [] }],
    })

    expect(saved.customServices).toHaveLength(1)
    expect(saved.customServices[0].services).toHaveLength(1)
  })

  it('creates the service once, however many times the domain is saved', async () => {
    const templateId = await createTemplate('real-estate')

    await patchDomain({ domainTypeTemplateId: templateId })
    const catalog = (await Domain.findById(domainA).lean()).customServices
    await patchDomain({ name: 'Renamed', customServices: catalog })

    expect(await housingFeeServices()).toHaveLength(1)
    const domain = await Domain.findById(domainA).lean()
    expect(domain.customServices.flatMap((g) => g.services)).toHaveLength(1)
  })

  it('does nothing for a domain of another category', async () => {
    const templateId = await createTemplate('utility')

    const saved = await patchDomain({ domainTypeTemplateId: templateId })

    expect(await housingFeeServices()).toHaveLength(0)
    expect(saved.customServices).toEqual([])
  })

  it('does nothing for a domain without a template', async () => {
    const saved = await patchDomain({ name: 'No template' })

    expect(await housingFeeServices()).toHaveLength(0)
    expect(saved.customServices).toEqual([])
  })

  it('is created along with a new real-estate domain', async () => {
    const templateId = await createTemplate('real-estate')
    await mockLoginAs(users.globalAdmin)
    const res = createMockResponse()

    await domainsHandler(
      {
        method: 'POST',
        body: {
          name: 'Новий ОСББ',
          streets: domains[0].streets,
          description: 'd',
          adminEmails: [users.globalAdmin.email],
          domainTypeTemplateId: templateId,
        },
      } as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(201)
    const created = res.json.mock.calls[0][0].data
    const [service] = await CustomService.find({
      domain: created._id,
      serviceType: ServiceType.HousingFee,
    }).lean()
    expect(created.customServices[0].services).toEqual([String(service._id)])
  })
})
