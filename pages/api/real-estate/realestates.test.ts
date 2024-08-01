import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import handler from './index'
import { expect } from '@jest/globals'
import { parseReceived } from '@utils/helpers'
import { users, realEstates, domains, streets } from '@utils/testData'
import { mockLoginAs } from '@utils/mockLoginAs'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('RealEstate API - GET', () => {
  it('request from the GlobalAdmin - show all companies', async () => {
    await mockLoginAs(users.globalAdmin)

    const mockReq = { method: 'GET', query: {} } as any
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
    const received = parseReceived(response.data)
    expect(received).toEqual(realEstates)
  })

  it('request from User - show User companies', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: {},
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
    const received = parseReceived(response.data)

    const expected = realEstates.filter((company) =>
      company.adminEmails.includes(users.user.email)
    )

    expect(received).toEqual(expected)
  })

  it('request from the GlobalAdmin with limit - success', async () => {
    const limit = 2

    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: { limit },
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
    const received = parseReceived(response.data)

    expect(received).toEqual(realEstates.slice(0, limit))
  })

  // TODO: FIX IT
  it('request from the GlobalAdmin by domainId, streetId - show that company', async () => {
    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: {
        domainId: domains[3]._id.toString(),
        streetId: streets[3]._id.toString(),
      },
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
    const received = parseReceived(response.data)
    const expected = realEstates.filter(
      (company) =>
        company.domain === domains[3]._id.toString() &&
        company.street === streets[3]._id.toString()
    )

    expect(received).toEqual(expected)
  })

  it('request from the User by domainId and streetId', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: {
        domainId: domains[0]._id.toString(),
        streetId: streets[0]._id.toString(),
      },
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

    const received = parseReceived(response.data)
    const expected = realEstates.filter(
      (company) =>
        company.adminEmails.includes(users.user.email) &&
        company.domain === domains[0]._id.toString() &&
        company.street === streets[0]._id.toString()
    )
    expect(response.status).toHaveBeenCalledWith(200)
    expect(received).toEqual(expected)
  })

  it('request from DomainAdmin - show DomainAdmin companies', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: {},
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

    const received = parseReceived(response.data)
    const expected = realEstates.filter((r) => r.domain === domains[0]._id)
    expect(received).toEqual(expected)
  })

  it('request from User by companyId - success', async () => {
    await mockLoginAs(users.user)
    const mockReq = {
      method: 'GET',
      query: { companyId: realEstates[0]._id.toString() },
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

    const received = parseReceived(response.data)
    const expected = [realEstates[0]]

    expect(received).toEqual(expected)
  })
  it('request from User by not his companyId - error ', async () => {
    await mockLoginAs(users.user)
    const mockReq = {
      method: 'GET',
      // not his company. should fail
      query: { companyId: realEstates[2]._id.toString() },
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

    const received = parseReceived(response.data)
    const expected = []

    expect(received).toEqual(expected)
  })
  it('request from DomainAdmin by not his companyId - error ', async () => {
    await mockLoginAs(users.domainAdmin)
    const mockReq = {
      method: 'GET',
      query: { companyId: realEstates[1]._id.toString() },
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

    const received = parseReceived(response.data)
    const expected = []

    expect(received).toEqual(expected)
  })
  it('request from DomainAdmin by companyId - success', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: { companyId: realEstates[0]._id.toString() },
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

    const received = parseReceived(response.data)
    const expected = [realEstates[0]]

    expect(received).toEqual(expected)
  })
  it('request from the GlobalAdmin by companyId - success', async () => {
    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: { companyId: realEstates[3]._id.toString() },
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
    const received = parseReceived(response.data)
    const expected = [realEstates[3]]

    expect(received).toEqual(expected)
  })

  it('request from DomainAdmin by domainId & streetId - show suitable companies', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: {
        domainId: domains[0]._id.toString(),
        streetId: streets[0]._id.toString(),
      },
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

    const received = parseReceived(response.data)
    const expected = realEstates[0]

    expect(response.status).toHaveBeenCalledWith(200)
    expect(received[0]).toEqual(expected)
  })

  it('request from DomainAdmin by domainId & streetId - don`t show not suitable companies', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: {
        domainId: domains[1]._id.toString(),
        streetId: streets[1]._id.toString(),
      },
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

  it('request from User by domainId & streetId - show suitable companies', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: {
        domainId: domains[0]._id.toString(),
        streetId: streets[0]._id.toString(),
      },
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

    const received = parseReceived(response.data)
    const expected = realEstates[0]

    expect(response.status).toHaveBeenCalledWith(200)
    expect(received[0]).toEqual(expected)
  })

  it('request from User by domainId & streetId - don`t show not suitable companies', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: {
        domainId: domains[2]._id.toString(),
        streetId: streets[2]._id.toString(),
      },
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

    const received = parseReceived(response.data)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(received).toEqual([])
  })

  it('test', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: {
        domainId: domains[2]._id.toString(),
        streetId: streets[2]._id.toString(),
      },
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

    const received = parseReceived(response.data)

    expect(response.status).toHaveBeenCalledWith(200)
    expect(received).toEqual([])
  })
})
