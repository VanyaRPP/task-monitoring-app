import { expect } from '@jest/globals'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, services, users } from '@utils/testData'
import handler from '.'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Service API - PATCH', () => {
  it('should update services as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

    const updatedData = { ...services[0], description: 'updated' }

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
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.data.description).toBe(updatedData.description)
  })

  it('should update valid services as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const updatedData = {
      ...services[0],
      description: 'updated',
      domain: domains[0],
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
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.data.description).toBe(updatedData.description)
  })

  it('should not update not valid services as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const updatedData = {
      ...services[1],
      description: 'updated',
      domain: domains[1],
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

  it('should not update valid services with not valid domain as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const updatedData = {
      ...services[0],
      description: 'updated',
      domain: domains[1],
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

    expect(response.status).toHaveBeenCalledWith(400)
  })

  it('should not update services as User', async () => {
    await mockLoginAs(users.user)

    const updatedData = { ...services[0], description: 'updated' }

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

    expect(response.status).toHaveBeenCalledWith(400)
  })

  it('should not update services with not valid fields as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

    const updatedData = {
      ...services[0],
      description: 'updated',
      notValidField: 'notValidField',
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
      data: mockRes.json.mock.lastCall[0].data,
    }

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.data.notValidField).toBe(undefined)
  })
})
