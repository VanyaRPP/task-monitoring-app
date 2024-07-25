import { expect } from '@jest/globals'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, payments, users } from '@utils/testData'
import handler from '.'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Payment API - PATCH', () => {
  it('should update payments as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

    const updatedData = { ...payments[0], description: 'updated' }

    const mockReq = {
      method: 'PATCH',
      query: { id: payments[0]._id },
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

  it('should update valid payments as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const updatedData = {
      ...payments[0],
      description: 'updated',
      domain: domains[0],
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: payments[0]._id },
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

  it('should not update not valid payments as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const updatedData = {
      ...payments[1],
      description: 'updated',
      domain: domains[1],
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: payments[1]._id },
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

  it('should not update valid payments with not valid domain as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const updatedData = {
      ...payments[0],
      description: 'updated',
      domain: domains[1],
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: payments[0]._id },
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

  it('should not update payments as User', async () => {
    await mockLoginAs(users.user)

    const updatedData = { ...payments[0], description: 'updated' }

    const mockReq = {
      method: 'PATCH',
      query: { id: payments[0]._id },
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

  it('should not update payments with not valid fields as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

    const updatedData = {
      ...payments[0],
      description: 'updated',
      notValidField: 'notValidField',
    }

    const mockReq = {
      method: 'PATCH',
      query: { id: payments[0]._id },
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

describe('Payment API - DELETE', () => {
  it('should delete payments as GlobalAdmin - success', async () => {
    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'DELETE',
      query: { id: payments[0]._id },
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
    expect(response.data._id.toString()).toBe(payments[0]._id.toString())
  })

  it('should delete payments as DomainAdmin - success', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'DELETE',
      query: { id: payments[0]._id },
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
    expect(response.data._id.toString()).toBe(payments[0]._id.toString())
  })

  it('should NOT delete payments as User - restricted access', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'DELETE',
      query: { id: payments[0]._id },
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

    expect(response.status).toHaveBeenCalledWith(400)
  })

  it('should NOT delete payments as NoRole - restricted access', async () => {
    await mockLoginAs(users.noRoleUser)

    const mockReq = {
      method: 'DELETE',
      query: { id: payments[2]._id },
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

    expect(response.status).toHaveBeenCalledWith(400)
  })

  it('should NOT delete payments as DomainAdmin of another domain - restricted access', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'DELETE',
      query: { id: payments[2]._id },
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

    expect(response.status).toHaveBeenCalledWith(400)
  })
})
