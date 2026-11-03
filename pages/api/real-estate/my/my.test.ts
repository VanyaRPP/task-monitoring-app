import { expect } from '@jest/globals'
import RealEstate from '@modules/models/RealEstate'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, streets, users } from '@utils/testData'
import handler from './index'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

async function getMyCompanies(method = 'GET'): Promise<{
  status: jest.Mock
  body: any
}> {
  const mockReq = { method, query: {} } as any
  const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any

  await handler(mockReq, mockRes)

  return { status: mockRes.status, body: mockRes.json.mock.lastCall[0] }
}

const namesOf = (body: any): string[] =>
  (body.data || []).map(({ companyName }) => companyName).sort()

/** Companies of the fixture set whose adminEmails list the given email. */
const ownedBy = (email: string): string[] =>
  realEstates
    .filter(({ adminEmails }) => adminEmails.includes(email))
    .map(({ companyName }) => companyName)
    .sort()

describe('Profile companies API - GET /api/real-estate/my', () => {
  it('returns the single company when the user administers exactly one', async () => {
    await RealEstate.create({
      domain: domains[1]._id,
      street: streets[1]._id,
      companyName: 'user2_only_company',
      description: 'none',
      adminEmails: [users.user2.email],
    })
    await mockLoginAs(users.user2)

    const { status, body } = await getMyCompanies()

    expect(status).toHaveBeenCalledWith(200)
    expect(namesOf(body)).toEqual(['user2_only_company'])
  })

  it('returns every company when the user administers several', async () => {
    await mockLoginAs(users.user)

    const { status, body } = await getMyCompanies()

    const expected = ownedBy(users.user.email)
    expect(status).toHaveBeenCalledWith(200)
    expect(expected.length).toBeGreaterThan(1)
    expect(namesOf(body)).toEqual(expected)
  })

  it('omits a company the user can access as domain admin but does not administer', async () => {
    // domainAdmin administers domains[0]; company_0 lives in that domain but is
    // administered by `user`, so it must not show up in domainAdmin's profile.
    const foreignCompany = realEstates.find(
      ({ domain, adminEmails }) =>
        domain === domains[0]._id &&
        !adminEmails.includes(users.domainAdmin.email)
    )
    expect(foreignCompany).toBeDefined()
    expect(domains[0].adminEmails).toContain(users.domainAdmin.email)

    await mockLoginAs(users.domainAdmin)

    const { status, body } = await getMyCompanies()

    expect(status).toHaveBeenCalledWith(200)
    expect(namesOf(body)).not.toContain(foreignCompany.companyName)
    expect(namesOf(body)).toEqual(ownedBy(users.domainAdmin.email))
  })

  it('returns an empty list when the user administers no company', async () => {
    await mockLoginAs(users.noRoleUser)

    const { status, body } = await getMyCompanies()

    expect(status).toHaveBeenCalledWith(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
  })

  it("never puts another user's company into the response payload", async () => {
    await mockLoginAs(users.user)

    const { body } = await getMyCompanies()

    const foreign = realEstates.filter(
      ({ adminEmails }) => !adminEmails.includes(users.user.email)
    )
    expect(foreign.length).toBeGreaterThan(0)

    const payload = JSON.stringify(body)
    for (const company of foreign) {
      expect(body.data).not.toContainEqual(
        expect.objectContaining({
          _id: expect.anything(),
          companyName: company.companyName,
        })
      )
      expect(payload).not.toContain(company._id)
    }
    for (const company of body.data) {
      expect(company.adminEmails).toBeUndefined()
    }
  })

  it('does not widen the list for a GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

    const { status, body } = await getMyCompanies()

    const expected = ownedBy(users.globalAdmin.email)
    expect(status).toHaveBeenCalledWith(200)
    expect(namesOf(body)).toEqual(expected)
    expect(body.data.length).toBeLessThan(realEstates.length)
  })

  it('includes archived companies the user administers', async () => {
    await mockLoginAs(users.user)

    const { body } = await getMyCompanies()

    const archivedOwn = realEstates.filter(
      ({ adminEmails, archived }) =>
        adminEmails.includes(users.user.email) && archived
    )
    expect(archivedOwn.length).toBeGreaterThan(0)
    for (const company of archivedOwn) {
      expect(namesOf(body)).toContain(company.companyName)
    }
  })

  it('rejects non-GET methods', async () => {
    await mockLoginAs(users.user)

    const { status, body } = await getMyCompanies('POST')

    expect(status).toHaveBeenCalledWith(405)
    expect(body.success).toBe(false)
  })
})
