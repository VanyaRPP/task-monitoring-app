import User from '@modules/models/User'
import { users } from '@utils/testData'
import http from 'http'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import handler from '../index'

jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve({ user: users.user }))
}))

describe('PATCH /api/user/:id', () => {
  let mongo: MongoMemoryServer

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create()
    await mongoose.connect(mongo.getUri())
  })

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase()
    await User.create(users.user)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongo.stop()
  })

  const exec = (id: string, body: any) => {
    const server = http.createServer((req, res) => handler(req as any, res as any))
    return request(server).patch(`/api/user/${id}`).send(body)
  }

  it('user can change own name', async () => {
    const user = await User.create(users.user)
  
    jest.mock('next-auth', () => ({
      getServerSession: jest.fn(() => Promise.resolve({ user }))
    }))
  
    const server = http.createServer((req, res) => handler(req as any, res as any))
    const res = await request(server)
      .patch(`/api/user/${user._id}`)
      .send({ name: 'New Name' })
  
    expect(res.statusCode).toBe(200)
  })
  
  
  it('global admin cannot assign GlobalAdmin role to others', async () => {
    const target = await User.create(users.user)
    const admin = await User.create(users.globalAdmin)
  
    jest.mock('next-auth', () => ({
      getServerSession: jest.fn(() => Promise.resolve({ user: admin }))
    }))
  
    const server = http.createServer((req, res) => handler(req as any, res as any))
    const res = await request(server)
      .patch(`/api/user/${target._id}`)
      .send({ roles: ['GlobalAdmin'] })
  
    expect(res.statusCode).toBe(400)
  })
  
  it('user cannot change another user', async () => {
    const target = await User.create(users.globalAdmin)
    const actor = await User.create(users.user)
  
    jest.mock('next-auth', () => ({
      getServerSession: jest.fn(() => Promise.resolve({ user: actor }))
    }))
  
    const server = http.createServer((req, res) => handler(req as any, res as any))
    const res = await request(server)
      .patch(`/api/user/${target._id}`)
      .send({ name: 'X' })
  
    expect(res.statusCode).toBe(400)
  })
  
  })