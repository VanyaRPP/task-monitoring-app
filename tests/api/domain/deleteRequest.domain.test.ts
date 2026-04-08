import { expect } from '@jest/globals'
import Domain from '@modules/models/Domain'
import handler from '@pages/api/domain/[id]/index'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { users, domains } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Domain API - DELETE', () => {
  beforeEach(async () => {
    await Domain.deleteMany({})
    jest.clearAllMocks()
  })

  it('should delete domain as GlobalAdmin - success', async () => {
    await mockLoginAs(users.globalAdmin)

    const testId = domains[0]._id.toString()

    await (Domain as any).create({
      ...domains[0],
      _id: testId
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
    await mockLoginAs(users.globalAdmin)

    const testId = '64d68421d9ba2fc8fea79a11'

    await (Domain as any).create({
      ...domains[1],
      _id: '64d68421d9ba2fc8fea79c11',
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
