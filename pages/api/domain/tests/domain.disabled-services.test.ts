import { expect } from '@jest/globals'
import domainHandler from '../[id]'
import domainServicesHandler from '@pages/api/custom-services/domain'

import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import Payment from '@modules/models/Payment'
import { createCustomService } from '@common/services/customServiceService/customService.service'
import { defaultServices } from '@utils/constants'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

// domains[0] is administered by users.domainAdmin, domains[1] by nobody.
const domainA = domains[0]._id
const domainB = domains[1]._id
const protectedServiceId = defaultServices[0]

const createMockResponse = () => {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  } as any
  return res
}

const patchDomain = async (
  domainId: string,
  body: Record<string, unknown>,
  as = users.globalAdmin
) => {
  await mockLoginAs(as)
  const res = createMockResponse()
  await domainHandler(
    { method: 'PATCH', query: { id: domainId }, body } as any,
    res
  )
  return res
}

/** Ids from GET /api/custom-services/domain, flattened across groups. */
const getCatalog = async (domainId: string, includeDisabled?: boolean) => {
  await mockLoginAs(users.globalAdmin)
  const res = createMockResponse()
  await domainServicesHandler(
    {
      method: 'GET',
      query: {
        domainId,
        ...(includeDisabled ? { includeDisabled: 'true' } : {}),
      },
    } as any,
    res
  )
  expect(res.status).toHaveBeenCalledWith(200)
  const groups = res.json.mock.calls[0][0].data as {
    services: { _id: unknown; isEnabled: boolean }[]
  }[]
  return groups
    .flatMap((g) => g.services)
    .map((s) => ({ id: String(s._id), isEnabled: s.isEnabled }))
}

const enabledIds = async (domainId: string) =>
  (await getCatalog(domainId)).map((s) => s.id)

let rent: string
let parking: string

beforeEach(async () => {
  const [rentDoc, parkingDoc] = await CustomService.create([
    { name: 'Розміщення', fieldName: 'rozmishchennia', domain: domainA },
    { name: 'Паркінг', fieldName: 'parking', domain: domainA },
  ])
  await CustomService.create({
    _id: protectedServiceId,
    name: 'Електропостачання',
    fieldName: 'electricityPrice',
  })
  rent = String(rentDoc._id)
  parking = String(parkingDoc._id)

  const groups = [
    { groupName: 'Загальні', services: [rent, parking, protectedServiceId] },
  ]
  await Domain.updateOne({ _id: domainA }, { customServices: groups })
  await Domain.updateOne({ _id: domainB }, { customServices: groups })
})

describe('Domain services on/off', () => {
  it('treats every existing service as enabled by default', async () => {
    const catalog = await getCatalog(domainA)

    expect(catalog.map((s) => s.id).sort()).toEqual(
      [rent, parking, protectedServiceId].sort()
    )
    expect(catalog.every((s) => s.isEnabled)).toBe(true)
  })

  it('makes a newly created domain service enabled', async () => {
    const created = await createCustomService(
      { name: 'Прибирання', domainId: domainA },
      {
        isGlobalAdmin: false,
        isDomainAdmin: true,
        isUser: false,
        user: { email: users.domainAdmin.email },
      }
    )
    expect(created.ok).toBe(true)
    const newId = String((created as { data: { _id: unknown } }).data._id)

    expect(await enabledIds(domainA)).toContain(newId)
  })

  it('hides a disabled service from the available list and restores it on re-enable', async () => {
    const off = await patchDomain(domainA, { disabledServiceIds: [parking] })
    expect(off.status).toHaveBeenCalledWith(200)

    expect(await enabledIds(domainA)).not.toContain(parking)
    // The management modal still gets it, flagged as disabled.
    expect(await getCatalog(domainA, true)).toContainEqual({
      id: parking,
      isEnabled: false,
    })

    await patchDomain(domainA, { disabledServiceIds: [] })

    expect(await enabledIds(domainA)).toContain(parking)
    // Re-enabling did not re-create or re-attach anything.
    expect(await CustomService.countDocuments({ name: 'Паркінг' })).toBe(1)
    const domain = await Domain.findById(domainA).lean()
    expect(domain.customServices[0].services).toEqual([
      rent,
      parking,
      protectedServiceId,
    ])
  })

  it('does not affect the same service in another domain', async () => {
    await patchDomain(domainA, { disabledServiceIds: [protectedServiceId] })

    expect(await enabledIds(domainA)).not.toContain(protectedServiceId)
    expect(await enabledIds(domainB)).toContain(protectedServiceId)
  })

  it('lets protected services be switched off and on', async () => {
    await patchDomain(domainA, { disabledServiceIds: [protectedServiceId] })
    expect(await enabledIds(domainA)).not.toContain(protectedServiceId)

    await patchDomain(domainA, { disabledServiceIds: [] })
    expect(await enabledIds(domainA)).toContain(protectedServiceId)
    expect(await CustomService.exists({ _id: protectedServiceId })).toBeTruthy()
  })

  it('leaves the stored list untouched when a PATCH does not carry it', async () => {
    await patchDomain(domainA, { disabledServiceIds: [parking] })
    await patchDomain(domainA, { description: 'updated' })

    const domain = await Domain.findById(domainA).lean()
    expect(domain.disabledServiceIds).toEqual([parking])
  })

  it('drops invalid and duplicate ids', async () => {
    await patchDomain(domainA, {
      disabledServiceIds: [parking, parking, 'not-an-id'],
    })

    const domain = await Domain.findById(domainA).lean()
    expect(domain.disabledServiceIds).toEqual([parking])
  })

  it.each([
    ['a plain user', users.user],
    ["another domain's admin", users.domainAdmin2],
  ])('rejects %s', async (_label, caller) => {
    const res = await patchDomain(
      domainA,
      { disabledServiceIds: [parking] },
      caller
    )

    expect(res.status).not.toHaveBeenCalledWith(200)
    const domain = await Domain.findById(domainA).lean()
    expect(domain.disabledServiceIds ?? []).toEqual([])
  })

  it('lets the domain admin toggle services of their own domain', async () => {
    const res = await patchDomain(
      domainA,
      { disabledServiceIds: [rent], adminEmails: [users.domainAdmin.email] },
      users.domainAdmin
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(await enabledIds(domainA)).not.toContain(rent)
  })

  it('keeps historical payments of the domain unchanged', async () => {
    const before = await Payment.find({ domain: domainA }).lean()
    expect(before.length).toBeGreaterThan(0)

    await patchDomain(domainA, {
      disabledServiceIds: [rent, parking, protectedServiceId],
    })

    expect(await Payment.find({ domain: domainA }).lean()).toEqual(before)
  })
})
