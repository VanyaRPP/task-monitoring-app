import {
  GetCompaniesQueryRequest,
  GetCompaniesQueryResponse,
} from '@common/api/realestateApi/realestate.api.types'
import { expect } from '@jest/globals'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, users } from '@utils/testData'
import handler from '..'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Company API - GET', () => {
  // TODO: move to testData.ts as user.role.companies
  const userCompanies = realEstates.filter(({ adminEmails }) =>
    adminEmails.includes(users.user.email)
  )
  const notUserCompanies = realEstates.filter(
    ({ adminEmails }) => !adminEmails.includes(users.user.email)
  )
  const domainAdminCompanies = realEstates.filter(
    ({ domain, adminEmails }) =>
      adminEmails.includes(users.domainAdmin.email) ||
      domains.find(
        ({ _id, adminEmails }) =>
          domain === _id && adminEmails.includes(users.domainAdmin.email)
      )
  )
  const notDomainAdminCompanies = realEstates.filter(
    ({ domain, adminEmails }) =>
      !adminEmails.includes(users.domainAdmin.email) &&
      !domains.find(
        ({ _id, adminEmails }) =>
          domain === _id && adminEmails.includes(users.domainAdmin.email)
      )
  )

  describe('query: {}', () => {
    it('should load Companies as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getRealEstatesQuery({})

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(realEstates)
    })
    it('should load Companies as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({})

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domainAdminCompanies)
    })
    it('should load Companies as User', async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({})

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(userCompanies)
    })
  })

  describe('query: { limit }', () => {
    it('should load Companies with limit as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getRealEstatesQuery({
        limit: 3,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(realEstates.slice(0, 3))
    })
    it('should load Companies with limit as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        limit: 3,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domainAdminCompanies.slice(0, 3))
    })
    it('should load Companies with limit as User', async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        limit: 3,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(userCompanies.slice(0, 3))
    })
  })

  describe('query: { skip }', () => {
    it('should load Companies with skip as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getRealEstatesQuery({
        skip: 1,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(realEstates.slice(1))
    })
    it('should load Companies with skip as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        skip: 1,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domainAdminCompanies.slice(1))
    })
    it('should load Companies with skip as User', async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        skip: 1,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(userCompanies.slice(1))
    })
  })

  describe('query: { limit, skip }', () => {
    it('should load Companies with limit and skip as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getRealEstatesQuery({
        limit: 3,
        skip: 1,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(realEstates.slice(1, 4))
    })
    it('should load Companies with limit and skip as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        limit: 3,
        skip: 1,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domainAdminCompanies.slice(1, 4))
    })
    it('should load Companies with limit and skip as User', async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        limit: 3,
        skip: 1,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(userCompanies.slice(1, 4))
    })
  })

  describe('query: { companyId } when single companyId provided', () => {
    it('should load Companies with companyId as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getRealEstatesQuery({
        companyId: realEstates[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual([realEstates[0]])
    })
    it('should load Companies with companyId as DomainAdmin if companyId is related to user', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        companyId: domainAdminCompanies[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual([domainAdminCompanies[0]])
    })
    it('should load Companies with companyId as User if companyId is related to user company', async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        companyId: userCompanies[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual([userCompanies[0]])
    })
    it('should NOT load Companies with companyId as DomainAdmin if companyId is NOT related to user domain', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        companyId: notDomainAdminCompanies[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
    it('should NOT load Companies with companyId as User if companyId is NOT related to user', async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        companyId: notUserCompanies[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
  })

  describe("query: { companyId } when multiple companyId's provided", () => {
    it("should load Companies with companyId's as GlobalAdmin", async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getRealEstatesQuery({
        companyId: realEstates.slice(0, 3).map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(realEstates.slice(0, 3))
    })
    it("should load Companies with companyId's as DomainAdmin", async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        companyId: domainAdminCompanies.slice(0, 3).map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(domainAdminCompanies.slice(0, 3))
    })
    it("should load Companies with companyId's as User", async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        companyId: userCompanies.slice(0, 3).map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(userCompanies.slice(0, 3))
    })
    it("should NOT load Companies with companyId's as DomainAdmin if companyId is NOT related to user domain", async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        companyId: notDomainAdminCompanies.slice(0, 3).map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
    it("should NOT load Companies with companyId's as User if companyId is NOT related to user", async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        companyId: notUserCompanies.slice(0, 3).map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
  })

  describe('query: { domainId } when single domainId provided', () => {
    it('should load Companies with domainId as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getRealEstatesQuery({
        domainId: realEstates[0].domain,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        realEstates.filter(({ domain }) => domain === realEstates[0].domain)
      )
    })
    it('should load Companies with domainId as DomainAdmin if domainId is related to user', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        domainId: domainAdminCompanies[0].domain,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        domainAdminCompanies.filter(
          ({ domain }) => domain === domainAdminCompanies[0].domain
        )
      )
    })
    it('should load Companies with domainId as User if domainId is related to user company', async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        domainId: userCompanies[0].domain,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        userCompanies.filter(({ domain }) => domain === userCompanies[0].domain)
      )
    })
    it('should NOT load Companies with domainId as DomainAdmin if domainId is NOT related to user', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        domainId: notDomainAdminCompanies[0].domain,
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
    it('should NOT load Companies with domainId as User if domainId is NOT related to user company', async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        domainId: notUserCompanies[0].domain,
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
  })

  describe("query: { domainId } when multiple domainId's provided", () => {
    it("should load Companies with domainId's as GlobalAdmin", async () => {
      await mockLoginAs(users.globalAdmin)

      const targetDomains = realEstates.slice(0, 3).map(({ domain }) => domain)

      const response = await getRealEstatesQuery({
        domainId: targetDomains,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        realEstates.filter(({ domain }) => targetDomains.includes(domain))
      )
    })
    it("should load Companies with domainId's as DomainAdmin", async () => {
      await mockLoginAs(users.domainAdmin)

      const targetDomains = domainAdminCompanies
        .slice(0, 3)
        .map(({ domain }) => domain)

      const response = await getRealEstatesQuery({
        domainId: targetDomains,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        domainAdminCompanies.filter(({ domain }) =>
          targetDomains.includes(domain)
        )
      )
    })
    it("should load Companies with domainId's as User", async () => {
      await mockLoginAs(users.user)

      const targetDomains = userCompanies
        .slice(0, 3)
        .map(({ domain }) => domain)

      const response = await getRealEstatesQuery({
        domainId: targetDomains,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        userCompanies.filter(({ domain }) => targetDomains.includes(domain))
      )
    })
    it("should NOT load Companies with domainId's as DomainAdmin if domainId is NOT related to user", async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        domainId: notDomainAdminCompanies
          .slice(0, 3)
          .map(({ domain }) => domain),
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
    it("should NOT load Companies with domainId's as User if domainId is NOT related to user company", async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        domainId: notUserCompanies.slice(0, 3).map(({ domain }) => domain),
      })

      expect(response.status).toHaveBeenCalledWith(403)
    })
  })

  describe('query: { streetId } when single streetId provided', () => {
    it('should load Companies with streetId as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getRealEstatesQuery({
        streetId: realEstates[0].street,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        realEstates.filter(({ street }) => street === realEstates[0].street)
      )
    })
    it('should load Companies with streetId as DomainAdmin if streetId is related to user', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        streetId: domainAdminCompanies[0].street,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        domainAdminCompanies.filter(
          ({ street }) => street === domainAdminCompanies[0].street
        )
      )
    })
    it('should load Companies with streetId as User if streetId is related to user company', async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        streetId: userCompanies[0].street,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        userCompanies.filter(({ street }) => street === userCompanies[0].street)
      )
    })
  })

  describe("query: { streetId } when multiple streetId's provided", () => {
    it("should load Companies with streetId's as GlobalAdmin", async () => {
      await mockLoginAs(users.globalAdmin)

      const targetStreets = realEstates.slice(0, 3).map(({ street }) => street)

      const response = await getRealEstatesQuery({
        streetId: targetStreets,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        realEstates.filter(({ street }) => targetStreets.includes(street))
      )
    })
    it("should load Companies with streetId's as DomainAdmin", async () => {
      await mockLoginAs(users.domainAdmin)

      const targetStreets = domainAdminCompanies
        .slice(0, 3)
        .map(({ street }) => street)

      const response = await getRealEstatesQuery({
        streetId: targetStreets,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        domainAdminCompanies.filter(({ street }) =>
          targetStreets.includes(street)
        )
      )
    })
    it("should load Companies with streetId's as User", async () => {
      await mockLoginAs(users.user)

      const targetStreets = userCompanies
        .slice(0, 3)
        .map(({ street }) => street)

      const response = await getRealEstatesQuery({
        streetId: targetStreets,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        userCompanies.filter(({ street }) => targetStreets.includes(street))
      )
    })
  })
})

async function getRealEstatesQuery(query: GetCompaniesQueryRequest): Promise<{
  status: number
  data: GetCompaniesQueryResponse
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
  return data?.map(({ _doc: company }) => {
    const { __v, _id, street, domain, ...rest } = company

    return {
      _id: _id.toString(),
      street: street._id.toString(),
      domain: domain._id.toString(),
      ...rest,
    }
  })
}
