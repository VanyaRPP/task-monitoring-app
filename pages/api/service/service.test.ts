import { expect } from '@jest/globals'
import handler from '.'

import { removeVersion, unpopulate } from '@utils/helpers'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, services, streets, users } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Service API - GET', () => {
  it('should load services as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

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

    const received = unpopulate(
      removeVersion(response.data.map((service) => service._doc))
    )
    const expected = services

    expect(received).toEqual(expected)
  })

  it('should load services as GlobalAdmin with limit', async () => {
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

    const received = unpopulate(
      removeVersion(response.data.map((service) => service._doc))
    )
    const expected = services.slice(0, limit)

    expect(received).toEqual(expected)
  })

  it('should load services as DomainAdmin', async () => {
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

    const received = unpopulate(
      removeVersion(response.data.map((service) => service._doc))
    )
    const expected = services.filter((service) =>
      domains
        .find((domain) => domain._id === service.domain)
        .adminEmails.includes(users.domainAdmin.email)
    )

    expect(received).toEqual(expected)
  })

  it('should load services as User', async () => {
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

    const received = unpopulate(
      removeVersion(response.data.map((service) => service._doc))
    )
    const expected = services.filter((service) => {
      const userCompanies = realEstates.filter((realEstate) =>
        realEstate.adminEmails.includes(users.user.email)
      )
      const userDomains = domains.filter((domain) =>
        userCompanies.find((realEstate) => realEstate.domain === domain._id)
      )
      return userDomains.find((domain) => service.domain === domain._id)
    })

    expect(received).toEqual(expected)
  })

  it('should load services as GlobalAdmin by domainId and streetId', async () => {
    await mockLoginAs(users.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: { domainId: domains[0]._id, streetId: streets[0]._id },
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

    const received = unpopulate(
      removeVersion(response.data.map((service) => service._doc))
    )
    const expected = services.filter(
      (service) =>
        service.domain === domains[0]._id && service.street === streets[0]._id
    )

    expect(received).toEqual(expected)
  })

  it('should load services as DomainAdmin by domainId and streetId', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: { domainId: domains[0]._id, streetId: streets[0]._id },
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

    const received = unpopulate(
      removeVersion(response.data.map((service) => service._doc))
    )
    const expected = services.filter(
      (service) =>
        domains
          .find((domain) => domain._id === service.domain)
          .adminEmails.includes(users.domainAdmin.email) &&
        service.domain === domains[0]._id &&
        service.street === streets[0]._id
    )

    expect(received).toEqual(expected)
  })

  it('should NOT load services as DomainAdmin by domainId and streetId - restricted access', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: { domainId: domains[1]._id, streetId: streets[1]._id },
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
    expect(response.data).toHaveLength(0)
  })

  it('should NOT load services as User by domainId and streetId - restricted access', async () => {
    await mockLoginAs(users.user)

    const mockReq = {
      method: 'GET',
      query: { domainId: domains[0]._id, streetId: streets[0]._id },
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
    expect(response.data).toHaveLength(0)
  })
})

describe('Service API - POST', () => {
  // TODO: POST tests
})
