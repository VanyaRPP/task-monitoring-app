import { expect } from '@jest/globals'
import adminDomainsHandler from '@pages/api/domain/admin/index'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

// The charts of the services page take their domains from this list.
const list = async () => {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  } as any

  await adminDomainsHandler({ method: 'GET', query: {} } as any, res)

  return {
    status: res.status.mock.lastCall[0],
    ids: res.json.mock.lastCall[0].data?.map(({ _id }) => String(_id)),
  }
}

describe('GET /api/domain/admin', () => {
  it('gives a GlobalAdmin every domain', async () => {
    await mockLoginAs(users.globalAdmin)

    const { status, ids } = await list()

    expect(status).toBe(200)
    expect(ids.sort()).toEqual(domains.map(({ _id }) => _id).sort())
  })

  it('gives a DomainAdmin only the domains they administer', async () => {
    await mockLoginAs(users.domainAdmin)

    const { ids } = await list()

    const own = domains
      .filter(({ adminEmails }) =>
        adminEmails.includes(users.domainAdmin.email)
      )
      .map(({ _id }) => _id)
    expect(own.length).toBeGreaterThan(0)
    expect(ids.sort()).toEqual(own.sort())
  })

  it('refuses a User', async () => {
    await mockLoginAs(users.user)

    const { status, ids } = await list()

    expect(status).toBe(403)
    expect(ids).toBeUndefined()
  })
})
