import { expect } from '@jest/globals'
import { ObjectId } from 'mongodb'
import { getServerSession } from 'next-auth'
import handler from '.'

import Service from '@common/modules/models/Service'
import Street from '@common/modules/models/Street'
import User from '@common/modules/models/User'
import { Roles } from '@utils/constants'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { removeVersion } from '@utils/helpers'


jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

beforeEach(async () => {
  await User.insertMany(Object.values(testUsersData))
    await (Street as any).insertMany(testStreetsData)
  await (Service as any).insertMany(testCompaniesData)
})

describe('Service API - GET', () => {
    it('load service as GlobalAdmin - success', async () => {
        await mockLoginAs(testUsersData.globalAdmin)

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

    const received = removeVersion(response.data.map((service) => service._doc))
    const expected = testCompaniesData

    expect(received).toEqual(expected)
  })

  it('load service as GlobalAdmin with limit - success', async () => {
    const limit = 2

    await mockLoginAs(testUsersData.globalAdmin)

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

    const received = removeVersion(response.data.map((service) => service._doc))
    const expected = testCompaniesData.slice(0, limit)

    expect(received).toEqual(expected)
  })


  it('load service as GlobalAdmin by serviceId - success', async () => {
    await mockLoginAs(testUsersData.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: { serviceId:testCompaniesData[0]._id.toString() },
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

    const received = removeVersion(response.data.map((service) => service._doc))
    const expected = [testCompaniesData[0]]

    expect(received).toEqual(expected)
  })

  it('load service as DomainAdmin by serviceId - success', async () => {
    await mockLoginAs(testUsersData.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: { serviceId: testCompaniesData[0]._id.toString() },
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

    const received = removeVersion(response.data.map((service) => service._doc))
    const expected = [testCompaniesData[0]]

    expect(received).toEqual(expected)
  })

  it('load service as User by serviceId - success', async () => {
    await mockLoginAs(testUsersData.user)

    const mockReq = {
      method: 'GET',
      query: { serviceId: testCompaniesData[0]._id.toString() },
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

    const received = removeVersion(response.data.map((service) => service._doc))
    const expected = [testCompaniesData[0]]

    expect(received).toEqual(expected)
  })

  it('load service as DomainAdmin by serviceId - restricted access', async () => {
    await mockLoginAs(testUsersData.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: { serviceId: testCompaniesData[1]._id.toString() },
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

  it('load service as User by serviceId - restricted access', async () => {
    await mockLoginAs(testUsersData.user)

    const mockReq = {
      method: 'GET',
      query: { serviceId: testCompaniesData[2]._id.toString() },
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

  it('load service as User by serviceId - restricted access', async () => {
    await mockLoginAs(testUsersData.user)

    const mockReq = {
      method: 'GET',
      query: { serviceId: testCompaniesData[3]._id.toString() },
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

  it('load service as User by serviceId - restricted access', async () => {
    await mockLoginAs(testUsersData.user)

    const mockReq = {
      method: 'GET',
      query: { serviceId: testCompaniesData[4]._id.toString() },
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
const testUsersData = {
  user: {
    name: 'user',
    email: 'user@example.com',
    roles: [Roles.USER],
  },
  domainAdmin: {
    name: 'domainAdmin',
    email: 'domainAdmin@example.com',
    roles: [Roles.DOMAIN_ADMIN],
  },
  globalAdmin: {
    name: 'globalAdmin',
    email: 'globalAdmin@example.com',
    roles: [Roles.GLOBAL_ADMIN],
  },
}



const testStreetsData = [
  {
    _id: new ObjectId(),
    address: 'street_0',
    city: 'street_0_city',
  },
  {
    _id: new ObjectId(),
    address: 'street_1',
    city: 'street_1_city',
  },
  {
    _id: new ObjectId(),
    address: 'street_2',
    city: 'street_2_city',
  },
]

const testCompaniesData = [
  {
    _id: new ObjectId(),
    area: [],
    name: testCompaniesData[0]._id,
    address: 'Domain_address_0',
    adminEmails: [testUsersData.domainAdmin.email],
    streets: testStreetsData[0]._id,
    description: 'none',
    bankInformation: 'none',
    phone: '+381234567890',
    email: 'domain_0@example.com',
  },
  {
    _id: new ObjectId(),
    area: [],
    name: testCompaniesData[1]._id,
    address: 'Domain_address_1',
    adminEmails: [],
    streets: testStreetsData[1]._id,
    description: 'none',
    bankInformation: 'none',
    phone: '+381234567891',
    email: 'domain_1@example.com',
  },
  {
    _id: new ObjectId(),
    area: [],
    name: testCompaniesData[2]._id,
    address: 'Domain_address_2',
    adminEmails: [],
    streets: testStreetsData[2]._id,
    description: 'none',
    bankInformation: 'none',
    phone: '+381234567892',
    email: 'domain_2@example.com',
  },
  {
    _id: new ObjectId(),
    area: [],
    name: testCompaniesData[3]._id,
    address: 'Domain_address_3',
    adminEmails: [],
    streets: testStreetsData[3]._id,
    description: 'none',
    bankInformation: 'none',
    phone: '+381234567893',
    email: 'domain_3@example.com',
  },
  {
    _id: new ObjectId(),
    area: [],
    name: testCompaniesData[4]._id,
    address: 'Domain_address_4',
    adminEmails: [],
    streets: testStreetsData[4]._id,
    description: 'none',
    bankInformation: 'none',
    phone: '+381234567894',
    email: 'domain_4@example.com',
  },
]


const mockLoginAs = async (mockUser: {
  email: string
  roles: Roles[]
}): Promise<void> =>
  await (getServerSession as any).mockResolvedValueOnce({ user: mockUser })
