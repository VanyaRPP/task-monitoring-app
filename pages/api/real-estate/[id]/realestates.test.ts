import { expect } from '@jest/globals'
import handler from '.'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { realEstates, users, domains } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('RealEstate API - PATCH', () => {
  it('should update realEstates as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

    const updatedData = { ...realEstates[0], description: 'updated' }

    const mockReq = {
      method: 'PATCH',
      query: { id: realEstates[0]._id },
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

  it('should update valid realEstates as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const updatedData = {
      ...realEstates[0],
      description: 'updated',
      domain: domains[0],
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: realEstates[0]._id },
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

  it('should not update not valid realEstates as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const updatedData = {
      ...realEstates[1],
      description: 'updated',
      domain: domains[1],
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: realEstates[1]._id },
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

  it('should not update valid realEstates with not valid domain as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const updatedData = {
      ...realEstates[0],
      description: 'updated',
      domain: domains[1],
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: realEstates[0]._id },
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

  it('should not update realEstates as User', async () => {
    await mockLoginAs(users.user)

    const updatedData = { ...realEstates[0], description: 'updated' }

    const mockReq = {
      method: 'PATCH',
      query: { id: realEstates[0]._id },
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

  it('should not update realEstates with not valid fields as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

    const updatedData = {
      ...realEstates[0],
      description: 'updated',
      notValidField: 'notValidField',
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: realEstates[0]._id },
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
