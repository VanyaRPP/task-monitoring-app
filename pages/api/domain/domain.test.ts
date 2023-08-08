import { MongoMemoryServer } from 'mongodb-memory-server'
import { getServerSession } from 'next-auth'
import { expect } from '@jest/globals'
import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'
import handler from '.'

import User from '@common/modules/models/User'
import Domain from '@common/modules/models/Domain'
import Street from '@common/modules/models/Street'
import RealEstate from '@common/modules/models/RealEstate'
import { Roles } from '@utils/constants'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

const server = new MongoMemoryServer()

beforeAll(async () => {
  await server.start()
  await mongoose.connect(server.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any)
})

beforeEach(async () => {
  await User.insertMany(Object.values(testUsersData))
  await (Street as any).insertMany(testStreetsData)
  await (Domain as any).insertMany(testDomainsData)
  await (RealEstate as any).insertMany(testRealEstatesData)
})

afterEach(async () => {
  await mongoose.connection.dropDatabase()
})

afterAll(async () => {
  await mongoose.disconnect()
  await server.stop()
})

describe('Domains API - GET', () => {
  it('load domains as GlobalAdmin with limit - success', async () => {
    await mockLoginAs(testUsersData.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: { limit: 2 },
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
    expect(response.data).toHaveLength(2)
  })

  it('load domains as DomainAdmin - success', async () => {
    await mockLoginAs(testUsersData.domainAdmin)

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
    expect(response.data).toHaveLength(2)
  })

  it('load domains as User - success', async () => {
    await mockLoginAs(testUsersData.user)

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
    expect(response.data).toHaveLength(2)
  })

  it('load domain as GlobalAdmin by domainId - success', async () => {
    await mockLoginAs(testUsersData.globalAdmin)

    const mockReq = {
      method: 'GET',
      query: { domainId: testDomainsData[0]._id.toString() },
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
    expect(response.data).toHaveLength(1)
  })

  it('load domain as DomainAdmin by domainId - success', async () => {
    await mockLoginAs(testUsersData.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: { domainId: testDomainsData[0]._id.toString() },
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
    expect(response.data).toHaveLength(1)
  })

  it('load domain as User by domainId - success', async () => {
    await mockLoginAs(testUsersData.user)

    const mockReq = {
      method: 'GET',
      query: { domainId: testDomainsData[0]._id.toString() },
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
    expect(response.data).toHaveLength(1)
  })

  it('load domain as DomainAdmin by domainId - restricted access', async () => {
    await mockLoginAs(testUsersData.domainAdmin)

    const mockReq = {
      method: 'GET',
      query: { domainId: testDomainsData[1]._id.toString() },
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

  it('load domain as User by domainId - restricted access', async () => {
    await mockLoginAs(testUsersData.user)

    const mockReq = {
      method: 'GET',
      query: { domainId: testDomainsData[2]._id.toString() },
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

describe('Domains API - POST', () => {
  // TODO: POST tests
})

const testUsersData = {
  user: {
    name: 'user',
    email: 'user@example.com',
    roles: [Roles.USER],
  },
  domainAdmin: {
    name: 'domain_admin',
    email: 'domain_admin@example.com',
    roles: [Roles.DOMAIN_ADMIN],
  },
  globalAdmin: {
    name: 'global_admin',
    email: 'global_admin@example.com',
    roles: [Roles.GLOBAL_ADMIN],
  },
}

const testDomainsData = [
  {
    _id: new ObjectId(),
    area: [],
    name: 'domain 0',
    address: 'Domain_address_0',
    adminEmails: [testUsersData.domainAdmin.email],
    streets: [],
    description: 'none',
    bankInformation: 'none',
    phone: '+381234567890',
    email: 'domain_0@example.com',
  },
  {
    _id: new ObjectId(),
    area: [],
    name: 'domain 1',
    address: 'Domain_address_1',
    adminEmails: [],
    streets: [],
    description: 'none',
    bankInformation: 'none',
    phone: '+381234567891',
    email: 'domain_1@example.com',
  },
  {
    _id: new ObjectId(),
    area: [],
    name: 'domain 2',
    address: 'Domain_address_2',
    adminEmails: [],
    streets: [],
    description: 'none',
    bankInformation: 'none',
    phone: '+381234567892',
    email: 'domain_2@example.com',
  },
  {
    _id: new ObjectId(),
    area: [],
    name: 'domain 3',
    address: 'Domain_address_3',
    adminEmails: [],
    streets: [],
    description: 'none',
    bankInformation: 'none',
    phone: '+381234567893',
    email: 'domain_3@example.com',
  },
  {
    _id: new ObjectId(),
    area: [],
    name: 'domain 4',
    address: 'Domain_address_4',
    adminEmails: [],
    streets: [],
    description: 'none',
    bankInformation: 'none',
    phone: '+381234567894',
    email: 'domain_4@example.com',
  },
  {
    _id: new ObjectId(),
    area: [],
    name: 'domain 5',
    address: 'Domain_address_5',
    adminEmails: [testUsersData.user.email, testUsersData.domainAdmin.email],
    streets: [],
    description: 'none',
    bankInformation: 'none',
    phone: '+381234567895',
    email: 'domain_5@example.com',
  },
]

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

const testRealEstatesData = [
  {
    _id: new ObjectId(),
    domain: testDomainsData[0]._id,
    street: testStreetsData[0]._id,
    companyName: 'company_0',
    bankInformation: 'none',
    agreement: 'none',
    phone: '+381234567800',
    adminEmails: [testUsersData.user.email],
    pricePerMeter: 10,
    servicePricePerMeter: 10,
    totalArea: 10,
    garbageCollector: 10,
  },
  {
    _id: new ObjectId(),
    domain: testDomainsData[1]._id,
    street: testStreetsData[1]._id,
    companyName: 'company_1',
    bankInformation: 'none',
    agreement: 'none',
    phone: '+381234567801',
    adminEmails: [testUsersData.user.email],
    pricePerMeter: 10,
    servicePricePerMeter: 10,
    totalArea: 10,
    garbageCollector: 10,
  },
  {
    _id: new ObjectId(),
    domain: testDomainsData[2]._id,
    street: testStreetsData[2]._id,
    companyName: 'company_2',
    bankInformation: 'none',
    agreement: 'none',
    phone: '+381234567802',
    adminEmails: [testUsersData.domainAdmin.email],
    pricePerMeter: 10,
    servicePricePerMeter: 10,
    totalArea: 10,
    garbageCollector: 10,
  },
]

const mockLoginAs = async (mockUser: {
  email: string
  roles: Roles[]
}): Promise<void> =>
  await (getServerSession as any).mockResolvedValueOnce({ user: mockUser })
