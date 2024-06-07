import {
  GetServicesQueryRequest,
  IService,
} from '@common/api/serviceApi/service.api.types'
import { expect } from '@jest/globals'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, services, users } from '@utils/testData'
import handler from '..'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Service API - GET', () => {
  // TODO: move to testData.ts as user.role.services
  const userServices = services.filter(({ domain }) =>
    realEstates.find(
      ({ adminEmails, domain: domainId }) =>
        domainId === domain && adminEmails.includes(users.user.email)
    )
  )
  const notUserServices = services.filter(
    ({ domain }) =>
      !realEstates.find(
        ({ adminEmails, domain: domainId }) =>
          domainId === domain && adminEmails.includes(users.user.email)
      )
  )
  const domainAdminServices = services.filter(
    ({ domain }) =>
      domains.find(
        ({ _id, adminEmails }) =>
          domain === _id && adminEmails.includes(users.domainAdmin.email)
      ) ||
      realEstates.find(
        ({ adminEmails, domain: domainId }) =>
          domainId === domain && adminEmails.includes(users.domainAdmin.email)
      )
  )
  const notDomainAdminServices = services.filter(
    ({ domain }) =>
      !domains.find(
        ({ _id, adminEmails }) =>
          domain === _id && adminEmails.includes(users.domainAdmin.email)
      ) &&
      !realEstates.find(
        ({ adminEmails, domain: domainId }) =>
          domainId === domain && adminEmails.includes(users.domainAdmin.email)
      )
  )

  describe('query: {}', () => {
    it('should load Services as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)
      const response = await getServicesQuery({})
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(services)
    })
    it('should load Services as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)
      const response = await getServicesQuery({})
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domainAdminServices)
    })
    it('should load Services as User', async () => {
      await mockLoginAs(users.user)
      const response = await getServicesQuery({})
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(userServices)
    })
  })

  describe('query: { limit }', () => {
    it('should load Services with limit as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)
      const response = await getServicesQuery({ limit: 3 })
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(services.slice(0, 3))
    })
    it('should load Services with limit as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)
      const response = await getServicesQuery({ limit: 3 })
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domainAdminServices.slice(0, 3))
    })
    it('should load Services with limit as User', async () => {
      await mockLoginAs(users.user)
      const response = await getServicesQuery({ limit: 3 })
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(userServices.slice(0, 3))
    })
  })

  describe('query: { skip }', () => {
    it('should load Services with skip as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)
      const response = await getServicesQuery({ skip: 2 })
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(services.slice(2))
    })
    it('should load Services with skip as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)
      const response = await getServicesQuery({ skip: 2 })
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domainAdminServices.slice(2))
    })
    it('should load Services with skip as User', async () => {
      await mockLoginAs(users.user)
      const response = await getServicesQuery({ skip: 2 })
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(userServices.slice(2))
    })
  })

  describe('query: { limit, skip }', () => {
    it('should load Services with limit and skip as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)
      const response = await getServicesQuery({ limit: 3, skip: 1 })
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(services.slice(1, 4))
    })
    it('should load Services with limit and skip as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)
      const response = await getServicesQuery({ limit: 3, skip: 1 })
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domainAdminServices.slice(1, 4))
    })
    it('should load Services with limit and skip as User', async () => {
      await mockLoginAs(users.user)
      const response = await getServicesQuery({ limit: 3, skip: 1 })
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(userServices.slice(1, 4))
    })
  })

  // TODO: filter by dates (year, quarter, month, day) and combinations

  describe('query: { serviceId } when single serviceId provided', () => {
    it('should load Services with serviceId as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getServicesQuery({
        serviceId: services[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual([services[0]])
    })
    it('should load Services with serviceId as DomainAdmin if serviceId is related to user', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getServicesQuery({
        serviceId: domainAdminServices[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual([domainAdminServices[0]])
    })
    it('should load Services with serviceId as User if serviceId is related to user company', async () => {
      await mockLoginAs(users.user)

      const response = await getServicesQuery({
        serviceId: userServices[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual([userServices[0]])
    })
    it('should NOT load Services with serviceId as DomainAdmin if serviceId is NOT related to user', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getServicesQuery({
        serviceId: notDomainAdminServices[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
    it('should NOT load Services with serviceId as User if serviceId is NOT related to user company', async () => {
      await mockLoginAs(users.user)

      const response = await getServicesQuery({
        serviceId: notUserServices[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
  })

  describe("query: { serviceId } when multiple serviceId's provided", () => {
    it("should load Services with serviceId's as GlobalAdmin", async () => {
      await mockLoginAs(users.globalAdmin)

      const targetDomains = services.slice(0, 3).map(({ _id }) => _id)

      const response = await getServicesQuery({
        serviceId: targetDomains,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        services.filter(({ _id }) => targetDomains.includes(_id))
      )
    })
    it("should load Services with serviceId's as DomainAdmin", async () => {
      await mockLoginAs(users.domainAdmin)

      const targetDomains = domainAdminServices
        .slice(0, 3)
        .map(({ _id }) => _id)

      const response = await getServicesQuery({
        serviceId: targetDomains,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        domainAdminServices.filter(({ _id }) => targetDomains.includes(_id))
      )
    })
    it("should load Services with serviceId's as User", async () => {
      await mockLoginAs(users.user)

      const targetDomains = userServices.slice(0, 3).map(({ _id }) => _id)

      const response = await getServicesQuery({
        serviceId: targetDomains,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        userServices.filter(({ _id }) => targetDomains.includes(_id))
      )
    })
    it("should NOT load Services with serviceId's as DomainAdmin if serviceId is NOT related to user", async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getServicesQuery({
        serviceId: notDomainAdminServices.slice(0, 3).map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
    it("should NOT load Services with serviceId's as User if serviceId is NOT related to user company", async () => {
      await mockLoginAs(users.user)

      const response = await getServicesQuery({
        serviceId: notUserServices.slice(0, 3).map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
  })

  describe('query: { domainId } when single domainId provided', () => {
    it('should load Services with domainId as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getServicesQuery({
        domainId: services[0].domain,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        services.filter(({ domain }) => domain === services[0].domain)
      )
    })
    it('should load Services with domainId as DomainAdmin if domainId is related to user', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getServicesQuery({
        domainId: domainAdminServices[0].domain,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        domainAdminServices.filter(
          ({ domain }) => domain === domainAdminServices[0].domain
        )
      )
    })
    it('should load Services with domainId as User if domainId is related to user company', async () => {
      await mockLoginAs(users.user)

      const response = await getServicesQuery({
        domainId: userServices[0].domain,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        userServices.filter(({ domain }) => domain === userServices[0].domain)
      )
    })
    it('should NOT load Services with domainId as DomainAdmin if domainId is NOT related to user', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getServicesQuery({
        domainId: notDomainAdminServices[0].domain,
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
    it('should NOT load Services with domainId as User if domainId is NOT related to user company', async () => {
      await mockLoginAs(users.user)

      const response = await getServicesQuery({
        domainId: notUserServices[0].domain,
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
  })

  describe("query: { domainId } when multiple domainId's provided", () => {
    it("should load Services with domainId's as GlobalAdmin", async () => {
      await mockLoginAs(users.globalAdmin)

      const targetDomains = services.slice(0, 3).map(({ domain }) => domain)

      const response = await getServicesQuery({
        domainId: targetDomains,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        services.filter(({ domain }) => targetDomains.includes(domain))
      )
    })
    it("should load Services with domainId's as DomainAdmin", async () => {
      await mockLoginAs(users.domainAdmin)

      const targetDomains = domainAdminServices
        .slice(0, 3)
        .map(({ domain }) => domain)

      const response = await getServicesQuery({
        domainId: targetDomains,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        domainAdminServices.filter(({ domain }) =>
          targetDomains.includes(domain)
        )
      )
    })
    it("should load Services with domainId's as User", async () => {
      await mockLoginAs(users.user)

      const targetDomains = userServices.slice(0, 3).map(({ domain }) => domain)

      const response = await getServicesQuery({
        domainId: targetDomains,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        userServices.filter(({ domain }) => targetDomains.includes(domain))
      )
    })
    it("should NOT load Services with domainId's as DomainAdmin if domainId is NOT related to user", async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getServicesQuery({
        domainId: notDomainAdminServices
          .slice(0, 3)
          .map(({ domain }) => domain),
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
    it("should NOT load Services with domainId's as User if domainId is NOT related to user company", async () => {
      await mockLoginAs(users.user)

      const response = await getServicesQuery({
        domainId: notUserServices.slice(0, 3).map(({ domain }) => domain),
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
  })

  describe('query: { streetId } when single streetId provided', () => {
    it('should load Services with streetId as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getServicesQuery({
        streetId: services[0].street,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        services.filter(({ street }) => street === services[0].street)
      )
    })
    it('should load Services with streetId as DomainAdmin if streetId is related to user', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getServicesQuery({
        streetId: domainAdminServices[0].street,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        domainAdminServices.filter(
          ({ street }) => street === domainAdminServices[0].street
        )
      )
    })
    it('should load Services with streetId as User if streetId is related to user company', async () => {
      await mockLoginAs(users.user)

      const response = await getServicesQuery({
        streetId: userServices[0].street,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        userServices.filter(({ street }) => street === userServices[0].street)
      )
    })
  })

  describe("query: { streetId } when multiple streetId's provided", () => {
    it("should load Services with streetId's as GlobalAdmin", async () => {
      await mockLoginAs(users.globalAdmin)

      const targetStreets = services.slice(0, 3).map(({ street }) => street)

      const response = await getServicesQuery({
        streetId: targetStreets,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        services.filter(({ street }) => targetStreets.includes(street))
      )
    })
    it("should load Services with streetId's as DomainAdmin", async () => {
      await mockLoginAs(users.domainAdmin)

      const targetStreets = domainAdminServices
        .slice(0, 3)
        .map(({ street }) => street)

      const response = await getServicesQuery({
        streetId: targetStreets,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        domainAdminServices.filter(({ street }) =>
          targetStreets.includes(street)
        )
      )
    })
    it("should load Services with streetId's as User", async () => {
      await mockLoginAs(users.user)

      const targetStreets = userServices.slice(0, 3).map(({ street }) => street)

      const response = await getServicesQuery({
        streetId: targetStreets,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        userServices.filter(({ street }) => targetStreets.includes(street))
      )
    })
  })
})

async function getServicesQuery(query: GetServicesQueryRequest): Promise<{
  status: number
  data: IService[]
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
  return data?.map(({ _doc: service }) => {
    const { __v, _id, street, domain, date, ...rest } = service

    return {
      _id: _id.toString(),
      street: street._id.toString(),
      domain: domain._id.toString(),
      date: new Date(date).toISOString(),
      ...rest,
    }
  })
}
