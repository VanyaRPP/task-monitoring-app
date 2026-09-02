import { expect } from '@jest/globals'
import handler from '@pages/api/domain/[id]/index'

import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

const buildReq = (domainId: string, customServices: any[]) =>
  ({
    method: 'PATCH',
    query: { id: domainId },
    body: { customServices },
  }) as any

const buildRes = () => {
  const res: any = {
    json: jest.fn(),
  }
  res.status = jest.fn(() => res)
  return res
}

describe('Domain API - PATCH service groups (customServices)', () => {
  it('allows Global Admin to create/edit/delete groups on any domain', async () => {
    await mockLoginAs(users.globalAdmin)

    const req = buildReq(domains[1]._id, [
      { groupName: 'Нова група', services: [] },
    ])
    const res = buildRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const savedGroups = res.json.mock.lastCall?.[0]?.data?.customServices
    expect(savedGroups).toHaveLength(1)
    expect(savedGroups[0].groupName).toBe('Нова група')
  })

  it('allows Domain Admin to create/edit/delete groups on their own domain', async () => {
    await mockLoginAs(users.domainAdmin)

    const req = buildReq(domains[0]._id, [
      { groupName: 'Перейменована група', services: [] },
    ])
    const res = buildRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const savedGroups = res.json.mock.lastCall?.[0]?.data?.customServices
    expect(savedGroups).toHaveLength(1)
    expect(savedGroups[0].groupName).toBe('Перейменована група')
  })

  it('denies Domain Admin managing groups on a domain they do not administer', async () => {
    await mockLoginAs(users.domainAdmin)

    const req = buildReq(domains[1]._id, [
      { groupName: 'Чужа група', services: [] },
    ])
    const res = buildRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('denies a User from managing groups altogether', async () => {
    await mockLoginAs(users.user)

    const req = buildReq(domains[0]._id, [
      { groupName: 'Група юзера', services: [] },
    ])
    const res = buildRes()

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})
