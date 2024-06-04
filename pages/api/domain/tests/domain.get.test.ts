import {
  GetDomainsQueryRequest,
  GetDomainsQueryResponse,
} from '@common/api/domainApi/domain.api.types'
import { expect } from '@jest/globals'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, users } from '@utils/testData'
import handler from '..'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Domain API - GET', () => {
  // TODO: move to testData.ts as user.role.domains
  const userDomains = domains.filter(({ _id }) =>
    realEstates.find(
      ({ domain, adminEmails }) =>
        domain === _id && adminEmails.includes(users.user.email)
    )
  )
  const notUserDomains = domains.filter(
    ({ _id }) =>
      !realEstates.find(
        ({ domain, adminEmails }) =>
          domain === _id && adminEmails.includes(users.user.email)
      )
  )
  const domainAdminDomains = domains.filter(({ adminEmails }) =>
    adminEmails.includes(users.domainAdmin.email)
  )
  const notDomainAdminDomains = domains.filter(
    ({ adminEmails }) => !adminEmails.includes(users.domainAdmin.email)
  )

  describe('query: {}', () => {
    it('should load Domains as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getDomainsQuery({})

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domains)
    })
    it('should load Domains as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getDomainsQuery({})

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domainAdminDomains)
    })
    it('should load Domains as User', async () => {
      await mockLoginAs(users.user)

      const response = await getDomainsQuery({})

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(userDomains)
    })
  })

  describe('query: { limit }', () => {
    it('should load Domains with limit as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getDomainsQuery({
        limit: 3,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domains.slice(0, 3))
    })
    it('should load Domains with limit as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getDomainsQuery({
        limit: 3,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domainAdminDomains.slice(0, 3))
    })
    it('should load Domains with limit as User', async () => {
      await mockLoginAs(users.user)

      const response = await getDomainsQuery({
        limit: 3,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(userDomains.slice(0, 3))
    })
  })

  describe('query: { skip }', () => {
    it('should load Domains with skip as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getDomainsQuery({
        skip: 1,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domains.slice(1))
    })
    it('should load Domains with skip as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getDomainsQuery({
        skip: 1,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domainAdminDomains.slice(1))
    })
    it('should load Domains with skip as User', async () => {
      await mockLoginAs(users.user)

      const response = await getDomainsQuery({
        skip: 1,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(userDomains.slice(1))
    })
  })

  describe('query: { limit, skip }', () => {
    it('should load Domains with limit and skip as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getDomainsQuery({
        limit: 3,
        skip: 1,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domains.slice(1, 4))
    })
    it('should load Domains with limit and skip as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getDomainsQuery({
        limit: 3,
        skip: 1,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domainAdminDomains.slice(1, 4))
    })
    it('should load Domains with limit and skip as User', async () => {
      await mockLoginAs(users.user)

      const response = await getDomainsQuery({
        limit: 3,
        skip: 1,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(userDomains.slice(1, 4))
    })
  })

  describe('query: { domainId } when single domainId provided', () => {
    it('should load Domains with domainId as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getDomainsQuery({
        domainId: domains[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual([domains[0]])
    })
    it('should load Domains with domainId as DomainAdmin if domainId is related to user', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getDomainsQuery({
        domainId: domainAdminDomains[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual([domainAdminDomains[0]])
    })
    it('should load Domains with domainId as User if domainId is related to user company', async () => {
      await mockLoginAs(users.user)

      const response = await getDomainsQuery({
        domainId: userDomains[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual([userDomains[0]])
    })
    it('should NOT load Domains with domainId as DomainAdmin if domainId is NOT related to user', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getDomainsQuery({
        domainId: notDomainAdminDomains[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
    it('should NOT load Domains with domainId as User if domainId is NOT related to user company', async () => {
      await mockLoginAs(users.user)

      const response = await getDomainsQuery({
        domainId: notUserDomains[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
  })

  describe("query: { domainId } when multiple domainId's provided", () => {
    it("should load Domains with domainId's as GlobalAdmin", async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getDomainsQuery({
        domainId: domains.slice(0, 3).map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domains.slice(0, 3))
    })
    it("should load Domains with domainId's as DomainAdmin", async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getDomainsQuery({
        domainId: domainAdminDomains.slice(0, 3).map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domainAdminDomains.slice(0, 3))
    })
    it("should load Domains with domainId's as User", async () => {
      await mockLoginAs(users.user)

      const response = await getDomainsQuery({
        domainId: userDomains.slice(0, 3).map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(userDomains.slice(0, 3))
    })
    it("should NOT load Domains with domainId's as DomainAdmin if domainId is NOT related to user", async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getDomainsQuery({
        domainId: notDomainAdminDomains.slice(0, 3).map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
    it("should NOT load Domains with domainId's as User if domainId is NOT related to user company", async () => {
      await mockLoginAs(users.user)

      const response = await getDomainsQuery({
        domainId: notUserDomains.slice(0, 3).map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
  })
})

async function getDomainsQuery(query: GetDomainsQueryRequest): Promise<{
  status: number
  data: GetDomainsQueryResponse
}> {
  const mockReq = { method: 'GET', query } as any
  const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any

  await handler(mockReq, mockRes)

  return {
    status: mockRes.status,
    data: parseReceived(mockRes.json.mock.lastCall[0].data),
  }
}

function parseReceived(data: any) {
  return data?.map(({ _doc: domain }) => {
    const { __v, _id, streets, ...rest } = domain

    return {
      _id: _id.toString(),
      streets: streets.map(({ _id }) => _id.toString()),
      ...rest,
    }
  })
}
