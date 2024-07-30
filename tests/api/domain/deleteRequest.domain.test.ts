import { expect } from '@jest/globals'
import Domain from '@modules/models/Domain'
import handler from '@pages/api/domain/[id]/index'
import { getCurrentUser } from '@utils/getCurrentUser'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { users } from '@utils/testData'

jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@utils/getCurrentUser', () => ({ getCurrentUser: jest.fn() }))

setupTestEnvironment()

describe('Domain API - DELETE', () => {
  it('should delete domain as GlobalAdmin - success', async () => {
    const testId = '64d68421d9ba2fc8fea79a11'
    ;(getCurrentUser as any).mockResolvedValueOnce({ isGlobalAdmin: true })
    await (Domain as any).create({
      _id: testId,
      name: 'domain 0',
      adminEmails: [users.domainAdmin.email],
      streets: [],
      description: 'none',
    })

    const mockReq = { method: 'DELETE', query: { id: testId } } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: `Domain ${testId} was deleted`,
    })
  })
  it('should show message domain not found as GlobalAdmin - success', async () => {
    const testId = '64d68421d9ba2fc8fea79a11'
    ;(getCurrentUser as any).mockResolvedValueOnce({ isGlobalAdmin: true })
    await (Domain as any).create({
      _id: '64d68421d9ba2fc8fea79c11',
      name: 'domain 0',
      adminEmails: [users.domainAdmin.email],
      streets: [],
      description: 'none',
    })

    const mockReq = { method: 'DELETE', query: { id: testId } } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      data: `Domain ${testId} was not found`,
    })
  })
})
