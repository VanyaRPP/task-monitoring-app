import { MongoMemoryServer } from 'mongodb-memory-server'
import Street from '@common/modules/models/Street'
import User from '@common/modules/models/User'
import { getServerSession } from 'next-auth'
import { Roles } from '@utils/constants'
import mongoose from 'mongoose'
import handler from './index'

const { expect } = require('@jest/globals')

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

beforeAll(async () => {
  const mongo = await MongoMemoryServer.create()
  const mongoUri = mongo.getUri()

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any)
})

afterEach(async () => {
  await mongoose.connection.dropDatabase()
})

afterAll(async () => {
  await mongoose.disconnect()
})

describe('API Route - GET Method', () => {
  it('should return streets without domainId', async () => {
    ;(getServerSession as any).mockResolvedValueOnce({
      user: { email: 'user@example.com', roles: [Roles.USER] },
    })

    await User.insertMany(testUsersData)
    await (Street as any).insertMany(testStreetsData)

    const mockRequest = { method: 'GET', query: { limit: 2 } } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    const responseData = mockResponse.json.mock.calls[0][0].data
    expect(responseData).toHaveLength(2)
  })
})

const testUsersData = [
  {
    name: 'user',
    email: 'user@example.com',
    roles: ['User'],
  },
]

const testStreetsData = [
  {
    _id: '649324b7ff4981c7363ceb31',
    address: 'Хлібна 25',
    city: 'Житомир',
  },
  {
    _id: '649324c0ff4981c7363ceb34',
    address: 'Мала Бердичівська 17 Б',
    city: 'Житомир',
  },
  {
    _id: '64ae9066671f79da860b5d5b',
    address: 'небесна сотня 24Г',
    city: 'Житомир',
  },
]
