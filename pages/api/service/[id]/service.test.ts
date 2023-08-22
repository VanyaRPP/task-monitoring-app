import { expect } from '@jest/globals'
import handler from '.'
import { removeVersion, unpopulate } from '@utils/helpers'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { services, users } from '@utils/testData'
import { Roles } from '@utils/constants'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Service API - PATCH', () => {
  it('should update services as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

    const {description, ...dataWithoutDescription} = services[0]
    const updatedData = {
      description: 'updated',
      ...dataWithoutDescription,
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: services[0]._id },
      body: updatedData,
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status
    }

    expect(response.status).toHaveBeenCalledWith(200)
  })

  it('should update valid services as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const { description, ...dataWithoutDescription } = services[0]
    const updatedData = {
      description: 'updated',
      ...dataWithoutDescription,
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: services[0]._id },
      body: updatedData,
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
    }

    expect(response.status).toHaveBeenCalledWith(200)
  })

  it('should not update not valid services as DomainAdmin', async () => {
    
    await mockLoginAs(users.domainAdmin)

    const { description, ...dataWithoutDescription } = services[1]
    const updatedData = {
      description: 'updated',
      ...dataWithoutDescription,
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: services[1]._id },
      body: updatedData,
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
    }

    expect(response.status).toHaveBeenCalledWith(400)
  })
})