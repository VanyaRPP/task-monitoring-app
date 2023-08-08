import { testPaymentsData, testUsersData } from '@utils/testData'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import Payment from '@common/modules/models/Payment'
import User from '@common/modules/models/User'
import { getServerSession } from 'next-auth'
import handler from './index'
import { Roles } from '@utils/constants'

jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/api.config', () => jest.fn())

const { expect } = require('@jest/globals')

setupTestEnvironment()

describe('API Route - GET Method', () => {
  it('should return', async () => {
    await Payment.insertMany(testPaymentsData)
    await User.insertMany(testUsersData)
    await mockLoginAs(testUsersData[0]) // as User

    // TODO: mock realestate
    const mockRequest = { method: 'GET', query: { limit: 2 } } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    // const responseData = mockResponse.json.mock.calls[0][0].data
    // expect(responseData).toHaveLength(2)
  })
})

const mockLoginAs = async (mockUser: {
  email: string
  roles: Roles[]
}): Promise<void> =>
  await (getServerSession as any).mockResolvedValueOnce({ user: mockUser })
