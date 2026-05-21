import { expect } from '@jest/globals'
import { sortById } from '@utils/helpers'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, users } from '@utils/testData'
import handler from '..'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

// Helper function to process expected data to match the output of parseReceived
function processExpected(data: any[]) {
  return sortById(
    data.map((item) => {
      const company = item._doc || item
      const {
        __v,
        _id,
        street,
        domain,
        account,
        cleaning,
        currency,
        customServices,
        services,
        ...rest
      } = company

      return {
        ...rest,
        _id: _id.toString(),
        street: (street?._id || street)?.toString(),
        domain: (domain?._id || domain)?.toString(),
        rnokpp: '',
      }
    })
  )
}

describe('Company API - GET', () => {
  const activeRealEstates = realEstates.filter((re) => !re.archived)

  const userCompanies = sortById(
    activeRealEstates.filter(({ adminEmails }) =>
      adminEmails.includes(users.user.email)
    )
  )

  const notUserCompanies = sortById(
    activeRealEstates.filter(
      ({ adminEmails }) => !adminEmails.includes(users.user.email)
    )
  )

  const domainAdminCompanies = sortById(
    activeRealEstates.filter(
      ({ domain, adminEmails }) =>
        adminEmails.includes(users.domainAdmin.email) ||
        domains.some(
          (d) =>
            d._id === domain && d.adminEmails.includes(users.domainAdmin.email)
        )
    )
  )

  const notDomainAdminCompanies = sortById(
    activeRealEstates.filter(
      ({ domain, adminEmails }) =>
        !adminEmails.includes(users.domainAdmin.email) &&
        !domains.some(
          (d) =>
            d._id === domain && d.adminEmails.includes(users.domainAdmin.email)
        )
    )
  )

  describe('query: {}', () => {
    it('should load Companies as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getRealEstatesQuery({})

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(processExpected(activeRealEstates))
    })
    it('should load Companies as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({})

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(processExpected(domainAdminCompanies))
    })
    it('should load Companies as User', async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({})

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(processExpected(userCompanies))
    })
  })

  describe('query: { limit }', () => {
    it('should load Companies with limit as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)

      const response = await getRealEstatesQuery({
        limit: 3,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        processExpected(activeRealEstates.slice(0, 3))
      )
    })
    it('should load Companies with limit as DomainAdmin', async () => {
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        limit: 3,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        processExpected(domainAdminCompanies.slice(0, 3))
      )
    })
    it('should load Companies with limit as User', async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        limit: 3,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(processExpected(userCompanies.slice(0, 3)))
    })
  })

  // describe('query: { skip }', () => {
  //   it('should load Companies with skip as GlobalAdmin', async () => {
  //     await mockLoginAs(users.globalAdmin)

  //     const response = await getRealEstatesQuery({
  //       skip: 1,
  //     })

  //     expect(response.status).toHaveBeenCalledWith(200)
  //     expect(response.data).toEqual(realEstates.slice(1))
  //   })
  //   it('should load Companies with skip as DomainAdmin', async () => {
  //     await mockLoginAs(users.domainAdmin)

  //     const response = await getRealEstatesQuery({
  //       skip: 1,
  //     })

  //     expect(response.status).toHaveBeenCalledWith(200)
  //     expect(response.data).toEqual(domainAdminCompanies.slice(1))
  //   })
  //   it('should load Companies with skip as User', async () => {
  //     await mockLoginAs(users.user)

  //     const response = await getRealEstatesQuery({
  //       skip: 1,
  //     })

  //     expect(response.status).toHaveBeenCalledWith(200)
  //     expect(response.data).toEqual(userCompanies.slice(1))
  //   })
  // })

  // describe('query: { limit, skip }', () => {
  //   it('should load Companies with limit and skip as GlobalAdmin', async () => {
  //     await mockLoginAs(users.globalAdmin)

  //     const response = await getRealEstatesQuery({
  //       limit: 3,
  //       skip: 1,
  //     })

  //     expect(response.status).toHaveBeenCalledWith(200)
  //     expect(response.data).toEqual(realEstates.slice(1, 4))
  //   })
  //   it('should load Companies with limit and skip as DomainAdmin', async () => {
  //     await mockLoginAs(users.domainAdmin)

  //     const response = await getRealEstatesQuery({
  //       limit: 3,
  //       skip: 1,
  //     })

  //     expect(response.status).toHaveBeenCalledWith(200)
  //     expect(response.data).toEqual(domainAdminCompanies.slice(1, 4))
  //   })
  //   it('should load Companies with limit and skip as User', async () => {
  //     await mockLoginAs(users.user)

  //     const response = await getRealEstatesQuery({
  //       limit: 3,
  //       skip: 1,
  //     })

  //     expect(response.status).toHaveBeenCalledWith(200)
  //     expect(response.data).toEqual(userCompanies.slice(1, 4))
  //   })
  // })

  describe('query: { companyId } when single companyId provided', () => {
    it('should load Companies with companyId as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)
      const target = activeRealEstates[0]

      const response = await getRealEstatesQuery({
        companyId: target._id,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(processExpected([target]))
    })
    it('should load Companies with companyId as DomainAdmin if companyId is related to user', async () => {
      if (!domainAdminCompanies.length) return
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        companyId: domainAdminCompanies[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(processExpected([domainAdminCompanies[0]]))
    })
    it('should load Companies with companyId as User if companyId is related to user company', async () => {
      if (!userCompanies.length) return
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        companyId: userCompanies[0]._id,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(processExpected([userCompanies[0]]))
    })
    it('should NOT load Companies with companyId as DomainAdmin if companyId is NOT related to user domain', async () => {
      if (!notDomainAdminCompanies.length) return
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        companyId: notDomainAdminCompanies[0]._id,
      })

      expect(response.data).toStrictEqual([])
    })
    it('should NOT load Companies with companyId as User if companyId is NOT related to user', async () => {
      await mockLoginAs(users.user)
      if (!notUserCompanies.length) return

      const response = await getRealEstatesQuery({
        companyId: notUserCompanies[0]._id,
      })

      expect(response.data).toStrictEqual([])
    })
  })

  describe("query: { companyId } when multiple companyId's provided", () => {
    it("should load Companies with companyId's as GlobalAdmin", async () => {
      await mockLoginAs(users.globalAdmin)
      const targets = activeRealEstates.slice(0, 3)

      const response = await getRealEstatesQuery({
        companyId: targets.map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(processExpected(targets))
    })
    it("should load Companies with companyId's as DomainAdmin", async () => {
      await mockLoginAs(users.domainAdmin)
      const targets = domainAdminCompanies.slice(0, 3)

      const response = await getRealEstatesQuery({
        companyId: targets.map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(processExpected(targets))
    })
    it("should load Companies with companyId's as User", async () => {
      await mockLoginAs(users.user)
      const targets = userCompanies.slice(0, 3)

      const response = await getRealEstatesQuery({
        companyId: targets.map(({ _id }) => _id),
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(processExpected(targets))
    })
    it("should NOT load Companies with companyId's as DomainAdmin if companyId is NOT related to user domain", async () => {
      if (!notDomainAdminCompanies.length) return
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        companyId: notDomainAdminCompanies.slice(0, 3).map(({ _id }) => _id),
      })

      expect(response.data).toStrictEqual([])
    })
    it("should NOT load Companies with companyId's as User if companyId is NOT related to user", async () => {
      await mockLoginAs(users.user)
      if (!notUserCompanies.length) return

      const response = await getRealEstatesQuery({
        companyId: notUserCompanies.slice(0, 3).map(({ _id }) => _id),
      })

      expect(response.data).toStrictEqual([])
    })
  })

  describe('query: { domainId } when single domainId provided', () => {
    it('should load Companies with domainId as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)
      const targetDomain = activeRealEstates[0].domain

      const response = await getRealEstatesQuery({
        domainId: targetDomain,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        processExpected(
          activeRealEstates.filter(({ domain }) => domain === targetDomain)
        )
      )
    })
    it('should load Companies with domainId as DomainAdmin if domainId is related to user', async () => {
      if (!domainAdminCompanies.length) return
      await mockLoginAs(users.domainAdmin)
      const targetDomain = domainAdminCompanies[0].domain

      const response = await getRealEstatesQuery({
        domainId: targetDomain,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        processExpected(
          domainAdminCompanies.filter(({ domain }) => domain === targetDomain)
        )
      )
    })
    it('should load Companies with domainId as User if domainId is related to user company', async () => {
      if (!userCompanies.length) return
      await mockLoginAs(users.user)
      const targetDomain = userCompanies[0].domain

      const response = await getRealEstatesQuery({
        domainId: targetDomain,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        processExpected(
          userCompanies.filter(({ domain }) => domain === targetDomain)
        )
      )
    })
    it('should NOT load Companies with domainId as DomainAdmin if domainId is NOT related to user', async () => {
      if (!notDomainAdminCompanies.length) return
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        domainId: notDomainAdminCompanies[0].domain,
      })

      expect(response.data).toStrictEqual([])
    })
    it('should NOT load Companies with domainId as User if domainId is NOT related to user company', async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        domainId: notUserCompanies[0].domain,
      })

      expect(response.data).toStrictEqual([])
    })
  })

  describe("query: { domainId } when multiple domainId's provided", () => {
    it("should load Companies with domainId's as GlobalAdmin", async () => {
      await mockLoginAs(users.globalAdmin)

      const targetDomains = activeRealEstates
        .slice(0, 3)
        .map(({ domain }) => domain)

      const response = await getRealEstatesQuery({
        domainId: targetDomains,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        processExpected(
          activeRealEstates.filter(({ domain }) =>
            targetDomains.includes(domain)
          )
        )
      )
    })
    it("should load Companies with domainId's as DomainAdmin", async () => {
      if (!domainAdminCompanies.length) return
      await mockLoginAs(users.domainAdmin)

      const targetDomains = domainAdminCompanies
        .slice(0, 3)
        .map(({ domain }) => domain)

      const response = await getRealEstatesQuery({
        domainId: targetDomains,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        processExpected(
          domainAdminCompanies.filter(({ domain }) =>
            targetDomains.includes(domain)
          )
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
        processExpected(
          userCompanies.filter(({ domain }) => targetDomains.includes(domain))
        )
      )
    })
    it("should NOT load Companies with domainId's as DomainAdmin if domainId is NOT related to user", async () => {
      if (!notDomainAdminCompanies.length) return
      await mockLoginAs(users.domainAdmin)

      const response = await getRealEstatesQuery({
        domainId: notDomainAdminCompanies
          .slice(0, 3)
          .map(({ domain }) => domain),
      })

      expect(response.data).toStrictEqual([])
    })
    it("should NOT load Companies with domainId's as User if domainId is NOT related to user company", async () => {
      await mockLoginAs(users.user)

      const response = await getRealEstatesQuery({
        domainId: notUserCompanies
          .map(({ domain }) => domain)
          .filter(
            (domain) =>
              !userCompanies.find((company) => company.domain === domain)
          ),
      })

      expect(response.data).toStrictEqual([])
    })
  })

  describe('query: { streetId } when single streetId provided', () => {
    it('should load Companies with streetId as GlobalAdmin', async () => {
      await mockLoginAs(users.globalAdmin)
      const targetStreet = activeRealEstates[0].street

      const response = await getRealEstatesQuery({
        streetId: targetStreet,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        processExpected(
          activeRealEstates.filter(({ street }) => street === targetStreet)
        )
      )
    })
    it('should load Companies with streetId as DomainAdmin if streetId is related to user', async () => {
      if (!domainAdminCompanies.length) return
      await mockLoginAs(users.domainAdmin)
      const targetStreet = domainAdminCompanies[0].street

      const response = await getRealEstatesQuery({
        streetId: targetStreet,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        processExpected(
          domainAdminCompanies.filter(({ street }) => street === targetStreet)
        )
      )
    })
    it('should load Companies with streetId as User if streetId is related to user company', async () => {
      if (!userCompanies.length) return
      await mockLoginAs(users.user)
      const targetStreet = userCompanies[0].street

      const response = await getRealEstatesQuery({
        streetId: targetStreet,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        processExpected(
          userCompanies.filter(({ street }) => street === targetStreet)
        )
      )
    })
  })

  describe("query: { streetId } when multiple streetId's provided", () => {
    it("should load Companies with streetId's as GlobalAdmin", async () => {
      await mockLoginAs(users.globalAdmin)

      const targetStreets = activeRealEstates
        .slice(0, 3)
        .map(({ street }) => street)

      const response = await getRealEstatesQuery({
        streetId: targetStreets,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        processExpected(
          activeRealEstates.filter(({ street }) =>
            targetStreets.includes(street)
          )
        )
      )
    })
    it("should load Companies with streetId's as DomainAdmin", async () => {
      if (!domainAdminCompanies.length) return
      await mockLoginAs(users.domainAdmin)

      const targetStreets = domainAdminCompanies
        .slice(0, 3)
        .map(({ street }) => street)

      const response = await getRealEstatesQuery({
        streetId: targetStreets,
      })

      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.data).toEqual(
        processExpected(
          domainAdminCompanies.filter(({ street }) =>
            targetStreets.includes(street)
          )
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
        processExpected(
          userCompanies.filter(({ street }) => targetStreets.includes(street))
        )
      )
    })
  })
})

async function getRealEstatesQuery(query: any): Promise<{
  status: number
  data: any
}> {
  const mockReq = { method: 'GET', query } as any
  const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any

  await handler(mockReq, mockRes)

  return {
    status: mockRes.status,
    data: sortById(parseReceived(mockRes.json.mock.lastCall[0].data || [])), // Ensure data is an array
  }
}

function parseReceived(data: any) {
  return data?.map((item: any) => {
    const company = item._doc || item
    const {
      __v,
      _id,
      street,
      domain,
      account,
      cleaning,
      currency,
      customServices,
      services,
      ...rest
    } = company

    return {
      ...rest,
      _id: _id.toString(),
      street: (street?._id || street)?.toString(),
      domain: (domain?._id || domain)?.toString(),
    }
  })
}
