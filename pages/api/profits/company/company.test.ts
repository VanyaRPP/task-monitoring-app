import { expect } from '@jest/globals'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { realEstates, users } from '@utils/testData'
import handler from './[companyId]'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

function createMockRes() {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn()
  return res
}

describe('Profits API – GET /api/profits/company/:companyId', () => {
  // Owned by users.user, not archived.
  const ownCompanyId = realEstates[1]._id
  const route = { method: 'GET' } as any

  it('403 for a user who does not administer the company', async () => {
    await mockLoginAs(users.user2)
    const mockReq = { ...route, query: { companyId: ownCompanyId } } as any
    const mockRes = createMockRes()

    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(403)
  })

  // A DomainAdmin does not automatically get this - it is the company's own
  // billing view, not a domain-scoped breakdown.
  it('403 for a DomainAdmin who does not personally administer the company', async () => {
    await mockLoginAs(users.domainAdmin2)
    const mockReq = { ...route, query: { companyId: ownCompanyId } } as any
    const mockRes = createMockRes()

    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(403)
  })

  it('200 for the company owner (company admin)', async () => {
    await mockLoginAs(users.user)
    const mockReq = { ...route, query: { companyId: ownCompanyId } } as any
    const mockRes = createMockRes()

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    const body = mockRes.json.mock.lastCall[0]
    expect(body.success).toBe(true)
    expect(body.data).toEqual(expect.any(Object))
    expect(body.meta).toEqual(expect.objectContaining({ page: 1, limit: 12 }))
  })

  it('200 for GlobalAdmin regardless of ownership', async () => {
    await mockLoginAs(users.globalAdmin)
    const mockReq = { ...route, query: { companyId: ownCompanyId } } as any
    const mockRes = createMockRes()

    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it('respects page/limit query params', async () => {
    await mockLoginAs(users.globalAdmin)
    const mockReq = {
      ...route,
      query: { companyId: ownCompanyId, page: '2', limit: '5' },
    } as any
    const mockRes = createMockRes()

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    const body = mockRes.json.mock.lastCall[0]
    expect(body.meta).toEqual(expect.objectContaining({ page: 2, limit: 5 }))
  })

  // Kept last: the handler returns 405 before calling getCurrentUser, so the
  // mockLoginAs value queued here is never consumed - placed anywhere earlier
  // it would leak into and corrupt the NEXT test's session (see mockLoginAs's
  // mockResolvedValueOnce, which has no per-test reset in this suite).
  it('rejects non-GET methods', async () => {
    await mockLoginAs(users.user)
    const mockReq = { method: 'POST', query: {} } as any
    const mockRes = createMockRes()

    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(405)
  })
})
