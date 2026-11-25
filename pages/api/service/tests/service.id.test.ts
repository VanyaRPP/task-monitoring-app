import { expect } from '@jest/globals'
import handler from '../[id]'
import Service from '@modules/models/Service'

import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, services, users } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

// users.domainAdmin administers domains[0] only
const ownDomain = domains[0]._id
const foreignDomain = domains[1]._id
const ownService = services.find((service) => service.domain === ownDomain)
const foreignService = services.find(
  (service) => service.domain === foreignDomain
)

const call = async (
  method: 'DELETE' | 'PATCH',
  id: string,
  body: Record<string, unknown> = {}
) => {
  const mockReq = { method, query: { id }, body } as any
  const mockRes = {
    status: jest.fn(() => mockRes),
    json: jest.fn(),
  } as any

  await handler(mockReq, mockRes)

  return mockRes
}

const findService = (id: string) => Service.findById(id).lean()

describe('Service API - DELETE /api/service/[id]', () => {
  it('lets a DomainAdmin delete a service of their domain', async () => {
    await mockLoginAs(users.domainAdmin)

    const res = await call('DELETE', ownService._id)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(await findService(ownService._id)).toBeNull()
  })

  it('does NOT let a DomainAdmin delete a service of a foreign domain', async () => {
    await mockLoginAs(users.domainAdmin)

    const res = await call('DELETE', foreignService._id)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(await findService(foreignService._id)).not.toBeNull()
  })

  it('lets a GlobalAdmin delete any service', async () => {
    await mockLoginAs(users.globalAdmin)

    const res = await call('DELETE', foreignService._id)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(await findService(foreignService._id)).toBeNull()
  })

  it('does NOT let a User delete a service', async () => {
    await mockLoginAs(users.user)

    const res = await call('DELETE', ownService._id)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(await findService(ownService._id)).not.toBeNull()
  })

  it('answers exactly once', async () => {
    await mockLoginAs(users.globalAdmin)

    const res = await call('DELETE', ownService._id)

    expect(res.json).toHaveBeenCalledTimes(1)
  })
})

describe('Service API - PATCH /api/service/[id]', () => {
  const description = 'changed'

  it('lets a DomainAdmin edit a service of their domain', async () => {
    await mockLoginAs(users.domainAdmin)

    const res = await call('PATCH', ownService._id, {
      domain: ownDomain,
      description,
    })

    expect(res.status).toHaveBeenCalledWith(200)
    expect((await findService(ownService._id)).description).toBe(description)
  })

  it('does NOT let a DomainAdmin take over a foreign service by sending their own domain', async () => {
    await mockLoginAs(users.domainAdmin)

    const res = await call('PATCH', foreignService._id, {
      domain: ownDomain,
      description,
    })

    expect(res.status).toHaveBeenCalledWith(400)
    const saved = await findService(foreignService._id)
    expect(saved.domain.toString()).toBe(foreignDomain)
    expect(saved.description).not.toBe(description)
  })

  it('does NOT let a DomainAdmin move their service to a foreign domain', async () => {
    await mockLoginAs(users.domainAdmin)

    const res = await call('PATCH', ownService._id, { domain: foreignDomain })

    expect(res.status).toHaveBeenCalledWith(400)
    expect((await findService(ownService._id)).domain.toString()).toBe(
      ownDomain
    )
  })

  it('does NOT let update operators bypass the target domain check', async () => {
    await mockLoginAs(users.domainAdmin)

    const res = await call('PATCH', ownService._id, {
      domain: ownDomain,
      $set: { domain: foreignDomain },
    })

    expect(res.status).toHaveBeenCalledWith(400)
    expect((await findService(ownService._id)).domain.toString()).toBe(
      ownDomain
    )
  })

  it('lets a GlobalAdmin edit any service', async () => {
    await mockLoginAs(users.globalAdmin)

    const res = await call('PATCH', foreignService._id, {
      domain: foreignDomain,
      description,
    })

    expect(res.status).toHaveBeenCalledWith(200)
    expect((await findService(foreignService._id)).description).toBe(
      description
    )
  })

  it('does NOT let a User edit a service', async () => {
    await mockLoginAs(users.user)

    const res = await call('PATCH', ownService._id, {
      domain: ownDomain,
      description,
    })

    expect(res.status).toHaveBeenCalledWith(400)
    expect((await findService(ownService._id)).description).not.toBe(
      description
    )
  })
})
