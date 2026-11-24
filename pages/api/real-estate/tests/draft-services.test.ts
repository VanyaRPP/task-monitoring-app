import { expect } from '@jest/globals'
import patchHandler from '../[id]'
import postHandler from '..'
import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, streets, users } from '@utils/testData'
import { DEFAULT_DRAFT_SERVICE_NAME } from '@utils/companyServiceDrafts'
import { getDomainServiceCatalog } from '@common/services/customServiceService/customService.service'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

const company = realEstates[5]
const domainId = domains[0]._id

const draft = (label: string, price: unknown = 150) => ({
  _id: `draft:${label}`,
  label,
  price,
  isDraft: true,
})

const call = async (
  handler: typeof patchHandler,
  req: { method: string; query?: object; body: object }
) => {
  const res = { status: jest.fn(() => res), json: jest.fn() } as any
  await handler({ query: {}, ...req } as any, res)
  return {
    status: res.status.mock.lastCall[0] as number,
    body: res.json.mock.lastCall[0],
  }
}

const patchCompany = (customServices: unknown[]) =>
  call(patchHandler, {
    method: 'PATCH',
    query: { id: company._id },
    body: { companyName: company.companyName, customServices },
  })

const domainServiceNames = async () =>
  (await CustomService.find({ domain: domainId }).lean()).map((s) => s.name)

describe('RealEstate API — services created inline in the company modal', () => {
  it('creates the draft in the domain and links it to this company only, with its price', async () => {
    const sibling = realEstates.find(
      (r) => r.domain === domainId && r._id !== company._id
    )
    await RealEstate.updateOne(
      { _id: sibling._id },
      { $set: { allServices: true, archived: false, customServices: [] } }
    )
    await mockLoginAs(users.domainAdmin)

    const { status, body } = await patchCompany([draft('Охорона', 320.5)])

    expect(status).toBe(200)
    const created = await CustomService.findOne({
      domain: domainId,
      name: 'Охорона',
    }).lean()
    expect(created).toBeTruthy()

    const saved = await RealEstate.findById(company._id).lean()
    expect(saved.customServices).toHaveLength(1)
    expect(String(saved.customServices[0]._id)).toBe(String(created._id))
    expect(saved.customServices[0]).toMatchObject({
      label: 'Охорона',
      fieldName: created.fieldName,
      price: 320.5,
    })
    expect(String(body.data.customServices[0]._id)).toBe(String(created._id))

    const domain = await Domain.findById(domainId).lean()
    expect(
      domain.customServices.flatMap((g) => g.services).map(String)
    ).toContain(String(created._id))

    const siblingAfter = await RealEstate.findById(sibling._id).lean()
    expect(siblingAfter.customServices).toHaveLength(0)
  })

  it('keeps existing services next to the new one', async () => {
    const existing = await CustomService.create({
      name: 'Прибирання',
      fieldName: 'pribyrannia',
      domain: domainId,
    })
    await mockLoginAs(users.domainAdmin)

    const { status } = await patchCompany([
      {
        _id: String(existing._id),
        label: 'Прибирання',
        fieldName: 'pribyrannia',
        price: 10,
      },
      draft('Охорона'),
    ])

    expect(status).toBe(200)
    const saved = await RealEstate.findById(company._id).lean()
    expect(saved.customServices.map((s) => s.label)).toEqual([
      'Прибирання',
      'Охорона',
    ])
  })

  it('creates the company and its new services together on POST', async () => {
    await mockLoginAs(users.domainAdmin)

    const { status, body } = await call(postHandler, {
      method: 'POST',
      body: {
        domain: domainId,
        street: streets[0]._id,
        companyName: 'New company',
        customServices: [draft('Охорона', 99)],
      },
    })

    expect(status).toBe(200)
    expect(await domainServiceNames()).toEqual(['Охорона'])
    const saved = await RealEstate.findById(body.data._id).lean()
    expect(saved.customServices[0]).toMatchObject({
      label: 'Охорона',
      price: 99,
    })
  })

  it.each([
    ['an empty name', '   '],
    ['the default placeholder name', DEFAULT_DRAFT_SERVICE_NAME],
  ])('rejects %s and creates nothing', async (_, label) => {
    await mockLoginAs(users.domainAdmin)

    const { status } = await patchCompany([draft(label)])

    expect(status).toBe(400)
    expect(await domainServiceNames()).toEqual([])
  })

  it('rejects a name already used in the domain (409) and leaves the company untouched', async () => {
    await CustomService.create({
      name: 'Охорона',
      fieldName: 'okhorona',
      domain: domainId,
    })
    await mockLoginAs(users.domainAdmin)

    const { status } = await patchCompany([draft('охорона ')])

    expect(status).toBe(409)
    expect(await domainServiceNames()).toEqual(['Охорона'])
    const saved = await RealEstate.findById(company._id).lean()
    expect(saved.customServices ?? []).toHaveLength(0)
  })

  it('rejects two drafts with the same name', async () => {
    await mockLoginAs(users.domainAdmin)

    const { status } = await patchCompany([
      { ...draft('Охорона'), _id: 'draft:a' },
      { ...draft('ОХОРОНА'), _id: 'draft:b' },
    ])

    expect(status).toBe(400)
    expect(await domainServiceNames()).toEqual([])
  })

  it('rolls the created services back when the company fails to save', async () => {
    await mockLoginAs(users.domainAdmin)

    const { status } = await patchCompany([
      draft('Охорона'),
      draft('Прибирання', 'not a number'),
    ])

    expect(status).toBe(400)
    expect(await domainServiceNames()).toEqual([])
    const domain = await Domain.findById(domainId).lean()
    expect(domain.customServices.flatMap((g) => g.services)).toHaveLength(0)
  })

  it('does not let a DomainAdmin create services in a domain they do not administer', async () => {
    await mockLoginAs(users.domainAdmin)

    const { status } = await call(postHandler, {
      method: 'POST',
      body: {
        domain: domains[1]._id,
        companyName: 'Foreign company',
        customServices: [draft('Охорона')],
      },
    })

    expect(status).toBe(403)
    expect(await CustomService.countDocuments({ name: 'Охорона' })).toBe(0)
  })

  it('does not let a plain User create services', async () => {
    await mockLoginAs(users.user)

    await patchCompany([draft('Охорона')])

    expect(await CustomService.countDocuments({ name: 'Охорона' })).toBe(0)
  })

  it('creates several new services in one save, each once, with its own price', async () => {
    await mockLoginAs(users.domainAdmin)

    const { status } = await patchCompany([
      draft('Охорона', 300),
      draft('Вивіз снігу', 150),
    ])

    expect(status).toBe(200)
    const created = await CustomService.find({ domain: domainId }).lean()
    expect(created.map((s) => s.name).sort()).toEqual([
      'Вивіз снігу',
      'Охорона',
    ])

    const saved = await RealEstate.findById(company._id).lean()
    expect(
      saved.customServices.map((s) => [s.label, s.price, String(s._id)])
    ).toEqual([
      ['Охорона', 300, String(created.find((s) => s.name === 'Охорона')._id)],
      [
        'Вивіз снігу',
        150,
        String(created.find((s) => s.name === 'Вивіз снігу')._id),
      ],
    ])
  })

  it('does not duplicate services when the same save is sent twice', async () => {
    await mockLoginAs(users.domainAdmin)
    const services = [draft('Охорона', 300)]

    const first = await patchCompany(services)
    await mockLoginAs(users.domainAdmin)
    const second = await patchCompany(services)

    expect(first.status).toBe(200)
    expect(second.status).toBe(409)
    expect(await domainServiceNames()).toEqual(['Охорона'])
    const saved = await RealEstate.findById(company._id).lean()
    expect(saved.customServices).toHaveLength(1)
  })

  it('succeeds on retry after a failed save, without leftovers from the failure', async () => {
    await mockLoginAs(users.domainAdmin)
    const failed = await patchCompany([draft('Охорона', 'not a number')])
    expect(failed.status).toBe(400)

    await mockLoginAs(users.domainAdmin)
    const retried = await patchCompany([draft('Охорона', 300)])

    expect(retried.status).toBe(200)
    expect(await domainServiceNames()).toEqual(['Охорона'])
    const domain = await Domain.findById(domainId).lean()
    expect(domain.customServices.flatMap((g) => g.services)).toHaveLength(1)
  })

  it('creates nothing when the company does not exist', async () => {
    await mockLoginAs(users.globalAdmin)

    const { status } = await call(patchHandler, {
      method: 'PATCH',
      query: { id: '64d68421d9ba2fc8fea79dff' },
      body: { domain: domainId, customServices: [draft('Охорона')] },
    })

    expect(status).toBe(404)
    expect(await domainServiceNames()).toEqual([])
  })

  it("GlobalAdmin: creates the service in the company's own domain when the body has none", async () => {
    await mockLoginAs(users.globalAdmin)

    const { status } = await patchCompany([draft('Охорона')])

    expect(status).toBe(200)
    expect(await domainServiceNames()).toEqual(['Охорона'])
  })

  it('a service created for company A appears in the domain catalog and can be added to company B by hand', async () => {
    const companyB = realEstates.find(
      (r) => r.domain === domainId && r._id !== company._id
    )
    await mockLoginAs(users.domainAdmin)
    await patchCompany([draft('Охорона', 300)])
    const created = await CustomService.findOne({ name: 'Охорона' }).lean()

    const catalog = await getDomainServiceCatalog(String(domainId))
    expect(
      catalog.flatMap((g) => g.services).map((s) => String(s._id))
    ).toContain(String(created._id))
    expect(
      (await RealEstate.findById(companyB._id).lean()).customServices ?? []
    ).toHaveLength(0)

    await mockLoginAs(users.domainAdmin)
    const { status } = await call(patchHandler, {
      method: 'PATCH',
      query: { id: companyB._id },
      body: {
        customServices: [
          {
            _id: String(created._id),
            label: created.name,
            fieldName: created.fieldName,
            price: 75,
          },
        ],
      },
    })

    expect(status).toBe(200)
    const savedB = await RealEstate.findById(companyB._id).lean()
    expect(String(savedB.customServices[0]._id)).toBe(String(created._id))
    expect(savedB.customServices[0].price).toBe(75)
    expect(await domainServiceNames()).toEqual(['Охорона'])
  })

  it('regression: a save with only existing services creates no service and keeps the price', async () => {
    const existing = await CustomService.create({
      name: 'Прибирання',
      fieldName: 'pribyrannia',
      domain: domainId,
    })
    await mockLoginAs(users.domainAdmin)

    const { status } = await patchCompany([
      {
        _id: String(existing._id),
        label: 'Прибирання',
        fieldName: 'pribyrannia',
        price: 42.5,
      },
    ])

    expect(status).toBe(200)
    expect(await domainServiceNames()).toEqual(['Прибирання'])
    const saved = await RealEstate.findById(company._id).lean()
    expect(saved.customServices).toEqual([
      expect.objectContaining({ label: 'Прибирання', price: 42.5 }),
    ])
  })
})
