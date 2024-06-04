import {
  GetStreetsQueryRequest,
  GetStreetsQueryResponse,
} from '@common/api/streetApi/street.api.types'
import { expect } from '@jest/globals'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, streets, users } from '@utils/testData'
import handler from '..'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Street API - GET', () => {
  describe('query: {}', () => {
    it('should load Streets as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getStreetsQuery({})

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(streets)
    })
    it('should load Streets as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getStreetsQuery({})

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(streets)
    })
    it('should load Streets as User', async () => {
      await mockLoginAs(users.user)

      const response = await getStreetsQuery({})

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(streets)
    })
  })

  describe('query: { limit }', () => {
    it('should load Streets with limit as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getStreetsQuery({
        limit: 10,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(streets.slice(0, 10))
    })
    it('should load Streets with limit as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getStreetsQuery({
        limit: 10,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(streets.slice(0, 10))
    })
    it('should load Streets with limit as User', async () => {
      await mockLoginAs(users.user)

      const response = await getStreetsQuery({
        limit: 10,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(streets.slice(0, 10))
    })
  })

  describe('query: { skip }', () => {
    it('should load Streets with skip as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getStreetsQuery({
        skip: 10,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(streets.slice(10))
    })
    it('should load Streets with skip as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getStreetsQuery({
        skip: 10,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(streets.slice(10))
    })
    it('should load Streets with skip as User', async () => {
      await mockLoginAs(users.user)

      const response = await getStreetsQuery({
        skip: 10,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(streets.slice(10))
    })
  })

  describe('query: { limit, skip }', () => {
    it('should load Streets with limit and skip as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getStreetsQuery({
        limit: 10,
        skip: 10,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(streets.slice(10, 20))
    })
    it('should load Streets with limit and skip as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getStreetsQuery({
        limit: 10,
        skip: 10,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(streets.slice(10, 20))
    })
    it('should load Streets with limit and skip as User', async () => {
      await mockLoginAs(users.user)

      const response = await getStreetsQuery({
        limit: 10,
        skip: 10,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(streets.slice(10, 20))
    })
  })

  describe('query: { domainId } when single domainId provided', () => {
    it('should load Streets by domainId as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getStreetsQuery({
        domainId: domains[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        streets.filter(({ _id }) => domains[0].streets.includes(_id))
      )
    })
    it('should load Streets by domainId as DomainAdmin if domainId is related to user', async () => {
      await mockLoginAs(users.domainAdmin)

      const targetDomain = domains.find(({ adminEmails }) =>
        adminEmails.includes(users.domainAdmin.email)
      )

      const response = await getStreetsQuery({
        domainId: targetDomain._id,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        streets.filter(({ _id }) => targetDomain.streets.includes(_id))
      )
    })
    it('should NOT load Streets by domainId as DomainAdmin if domainId is NOT related to user', async () => {
      await mockLoginAs(users.domainAdmin)

      const targetDomain = domains.find(
        ({ adminEmails }) => !adminEmails.includes(users.domainAdmin.email)
      )

      const response = await getStreetsQuery({
        domainId: targetDomain._id,
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
    it('should NOT load Streets by domainId as User', async () => {
      await mockLoginAs(users.user)

      const response = await getStreetsQuery({
        domainId: domains[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
  })

  describe("query: { domainId } when multiple domainId's provided", () => {
    it("should load Streets by domainId's as GlobalAdmin", async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getStreetsQuery({
        domainId: [domains[0]._id, domains[1]._id],
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        streets.filter(({ _id }) =>
          [...domains[0].streets, ...domains[1].streets].includes(_id)
        )
      )
    })
    it("should load Streets by domainId's as DomainAdmin if domainId's is related to user", async () => {
      await mockLoginAs(users.domainAdmin)

      const targetDomains = domains.filter(({ adminEmails }) =>
        adminEmails.includes(users.domainAdmin.email)
      )

      const response = await getStreetsQuery({
        domainId: targetDomains.map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        streets.filter(({ _id }) =>
          targetDomains
            .map(({ streets }) => streets)
            .flat()
            .includes(_id)
        )
      )
    })
    it("should NOT load Streets by domainId's as DomainAdmin if domainId's is NOT related to user", async () => {
      await mockLoginAs(users.domainAdmin)

      const targetDomains = domains.filter(
        ({ adminEmails }) => !adminEmails.includes(users.domainAdmin.email)
      )

      const response = await getStreetsQuery({
        domainId: targetDomains.map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
    it("should NOT load Streets by domainId's as User", async () => {
      await mockLoginAs(users.user)

      const response = await getStreetsQuery({
        domainId: [domains[0]._id, domains[1]._id],
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
  })
})

async function getStreetsQuery(query: GetStreetsQueryRequest): Promise<{
  status: number
  data: GetStreetsQueryResponse
}> {
  const mockReq = { method: 'GET', query } as any
  const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any

  await handler(mockReq, mockRes)

  return {
    status: mockRes.status,
    data: parseReceived(mockRes.json.mock.lastCall[0].data),
  }
}

function parseReceived(data: any | undefined) {
  return data?.map(({ _doc: street }) => {
    const { __v, _id, ...rest } = street

    return {
      _id: _id.toString(),
      ...rest,
    }
  })
}
