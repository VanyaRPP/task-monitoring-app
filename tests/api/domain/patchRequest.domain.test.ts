import { expect } from '@jest/globals'
import handler from '@pages/api/domain/[id]/index'

import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Domain API - PATCH', () => {
  it('should update domains as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

    const updatedData = { ...domains[0], description: 'updated' }

    const mockReq = {
      method: 'PATCH',
      query: { id: domains[0]._id },
      body: updatedData,
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.data.description).toBe(updatedData.description)
  })

  it('should not update domains as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const updatedData = {
      ...domains[0],
      description: 'updated',
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: domains[0]._id },
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

  it('should not update domains as User', async () => {
    await mockLoginAs(users.user)

    const updatedData = { ...domains[0], description: 'updated' }

    const mockReq = {
      method: 'PATCH',
      query: { id: domains[0]._id },
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

  it('should not update domains with not valid fields as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

    const updatedData = {
      ...domains[0],
      description: 'updated',
      notValidField: 'notValidField',
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: domains[0]._id },
      body: updatedData,
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.data.notValidField).toBe(undefined)
  })
})
