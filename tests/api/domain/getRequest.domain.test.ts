import { expect } from '@jest/globals'
import handler from '@pages/api/domain/index'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import Street from '@modules/models/Street'

import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, users, streets } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Domains API - GET', () => {
  beforeEach(async () => {
    await Domain.deleteMany({})
    await RealEstate.deleteMany({})
    await Street.deleteMany({})

    await Street.insertMany(streets)
    await Domain.insertMany(domains)
    await RealEstate.insertMany(realEstates)
  })

  const clean = (obj: any) => JSON.parse(JSON.stringify(obj))

  const getExpectedDomains = (filterFn = (d: any) => true) => {
    return domains.filter(filterFn).map((domain) => ({
      ...domain,
      _id: domain._id.toString(),
      __v: 0,
      streets: domain.streets.map((sId) => {
        const street = streets.find((s) => s._id.toString() === sId.toString())
        return street ? { ...street, _id: street._id.toString(), __v: 0 } : sId
      }),
      customServices: domain.customServices || [],
      domainBankToken: domain.domainBankToken || [],
      domainServices: domain.domainServices || [],
    }))
  }

  it('load domains as GlobalAdmin - success', async () => {
    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: {},
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    const received = clean(mockRes.json.mock.lastCall[0].data)
    expect(received).toEqual(clean(getExpectedDomains()))
  })

  it('load domains as GlobalAdmin with limit - success', async () => {
    const limit = 2

    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: { limit },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    const received = clean(mockRes.json.mock.lastCall[0].data)
    expect(received).toEqual(clean(getExpectedDomains().slice(0, limit)))
  })

  it('load domains as DomainAdmin - success', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: {},
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    const received = clean(mockRes.json.mock.lastCall[0].data)
    const expected = getExpectedDomains((domain) =>
      domain.adminEmails.includes(users.domainAdmin.email)
    )
    expect(received).toEqual(clean(expected))
  })

  it('load domains as User - success', async () => {
    // user2 administers no domain, so a plain User sees an empty list.
    await mockLoginAs(users.user2)

    const mockReq = {
      method: 'GET',
      query: {},
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    const received = mockRes.json.mock.lastCall[0].data
    expect(received).toEqual([])
  })

  it('load domain as GlobalAdmin by domainId - success', async () => {
    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: { domainId: domains[0]._id.toString() },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    const received = clean(mockRes.json.mock.lastCall[0].data)
    const expected = getExpectedDomains(
      (d) => d._id.toString() === domains[0]._id.toString()
    )
    expect(received).toEqual(clean(expected))
  })

  it('load domain as DomainAdmin by domainId - success', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: { domainId: domains[0]._id.toString() },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    const received = clean(mockRes.json.mock.lastCall[0].data)
    const expected = getExpectedDomains(
      (d) => d._id.toString() === domains[0]._id.toString()
    )
    expect(received).toEqual(clean(expected))
  })

  it('load domain as User by domainId - success', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: { domainId: domains[0]._id.toString() },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    const received = mockRes.json.mock.lastCall[0].data
    expect(received).toEqual([])
  })

  it('load domain as DomainAdmin by domainId - restricted access', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: { domainId: domains[1]._id.toString() },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json.mock.lastCall[0].data).toHaveLength(0)
  })

  it('load domain as User by domainId - restricted access', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: { domainId: domains[2]._id.toString() },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json.mock.lastCall[0].data).toHaveLength(0)
  })
})
