import User from '@modules/models/User'
import { users } from '@utils/testData'
import mongoose from 'mongoose'
import { createMocks } from 'node-mocks-http'
import handler from '../index'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({ user: users.user })),
}))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

let mongo: any

beforeAll(async () => {
  const { MongoMemoryServer } = await import('mongodb-memory-server')
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase()
})

const exec = async (id: string, body: any, sessionUser: any) => {
  const { getServerSession } = require('next-auth')
  getServerSession.mockResolvedValueOnce({ user: sessionUser })

  const { req, res } = createMocks({
    method: 'PATCH',
    url: `/api/user/${id}`,
    query: { id },
    body,
  })

  await handler(req as any, res as any)
  return res
}

describe('PATCH /api/user/:id', () => {
  it('user cannot change own role', async () => {
    const user = users.user
    const created = await User.create(user)
    const res = await exec(created._id.toString(), { roles: ['GlobalAdmin'] }, created)
    expect(res._getStatusCode()).toBe(400)
  })
  
  it('global admin cannot assign GlobalAdmin role to others', async () => {
    const target = await User.create(users.user)
    const admin = await User.create(users.globalAdmin)
    const res = await exec(target._id.toString(), { roles: ['GlobalAdmin'] }, admin)
    expect(res._getStatusCode()).toBe(400)
  })

  it('user cannot change another user', async () => {
    const target = await User.create(users.globalAdmin)
    const actor = await User.create(users.user)
    const res = await exec(target._id.toString(), { name: 'X' }, actor)
    expect(res._getStatusCode()).toBe(400)
  })
})
