import { expect } from '@jest/globals'
import handler from '@pages/api/domain/[id]/index'
import Domain from '@modules/models/Domain'
import Street from '@modules/models/Street'

import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users, streets } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Domains API - ARCHIVE / UNARCHIVE', () => {
  beforeEach(async () => {
    await Domain.deleteMany({})
    await Street.deleteMany({})

    await Street.insertMany(streets)
    await Domain.insertMany(domains)
  })

  //архівація 4 тести

  describe('Archive domain (PATCH archived: true)', () => {
    it('GlobalAdmin can archive any domain - success', async () => {
      await mockLoginAs(users.globalAdmin)

      const mockReq = {
        method: 'PATCH',
        query: { id: domains[0]._id.toString() },
        body: { archived: true },
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json.mock.lastCall[0].success).toBe(true)

      const updated = await Domain.findById(domains[0]._id)
      expect(updated.archived).toBe(true)
    })

    it('DomainAdmin can archive own domain - success', async () => {
      await mockLoginAs(users.domainAdmin)

      const mockReq = {
        method: 'PATCH',
        query: { id: domains[0]._id.toString() },
        body: { archived: true },
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json.mock.lastCall[0].success).toBe(true)

      const updated = await Domain.findById(domains[0]._id)
      expect(updated.archived).toBe(true)
    })

    it('DomainAdmin cannot archive domain they do not own - fail', async () => {
      await mockLoginAs(users.domainAdmin)

      const mockReq = {
        method: 'PATCH',
        query: { id: domains[1]._id.toString() }, 
        body: { archived: true },
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json.mock.lastCall[0].success).toBe(false)

      const unchanged = await Domain.findById(domains[1]._id)
      expect(unchanged.archived).toBe(false)
    })

    it('User cannot archive any domain - fail', async () => {
      await mockLoginAs(users.user)

      const mockReq = {
        method: 'PATCH',
        query: { id: domains[0]._id.toString() },
        body: { archived: true },
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json.mock.lastCall[0].success).toBe(false)

      const unchanged = await Domain.findById(domains[0]._id)
      expect(unchanged.archived).toBe(false)
    })
  })

  //розархівація 4 тести

  describe('Unarchive domain (PATCH archived: false)', () => {
    it('GlobalAdmin can unarchive any domain - success', async () => {
      await mockLoginAs(users.globalAdmin)

      const mockReq = {
        method: 'PATCH',
        query: { id: domains[6]._id.toString() }, 
        body: { archived: false },
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json.mock.lastCall[0].success).toBe(true)

      const updated = await Domain.findById(domains[6]._id)
      expect(updated.archived).toBe(false)
    })

    it('DomainAdmin can unarchive own domain - success', async () => {
      await mockLoginAs(users.domainAdmin2)

      const mockReq = {
        method: 'PATCH',
        query: { id: domains[6]._id.toString() }, 
        body: { archived: false },
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json.mock.lastCall[0].success).toBe(true)

      const updated = await Domain.findById(domains[6]._id)
      expect(updated.archived).toBe(false)
    })

    it('DomainAdmin cannot unarchive domain they do not own - fail', async () => {
      await mockLoginAs(users.domainAdmin)

      const mockReq = {
        method: 'PATCH',
        query: { id: domains[6]._id.toString() }, 
        body: { archived: false },
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json.mock.lastCall[0].success).toBe(false)

      const unchanged = await Domain.findById(domains[6]._id)
      expect(unchanged.archived).toBe(true)
    })

    it('User cannot unarchive any domain - fail', async () => {
      await mockLoginAs(users.user)

      const mockReq = {
        method: 'PATCH',
        query: { id: domains[6]._id.toString() },
        body: { archived: false },
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json.mock.lastCall[0].success).toBe(false)

      const unchanged = await Domain.findById(domains[6]._id)
      expect(unchanged.archived).toBe(true)
    })
  })

  //фільтр після архівації 2 тести

  describe('GET filter after archive', () => {
    it('archived domain does not appear in GET without archived param', async () => {
      await Domain.findByIdAndUpdate(domains[0]._id, { archived: true })

      await mockLoginAs(users.globalAdmin)

      const getHandler = require('@pages/api/domain/index').default

      const mockReq = {
        method: 'GET',
        query: {},
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await getHandler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      const ids = mockRes.json.mock.lastCall[0].data.map((d: any) => d._id.toString())
      expect(ids).not.toContain(domains[0]._id.toString())
    })

    it('archived domain appears in GET with archived=true', async () => {
      await Domain.findByIdAndUpdate(domains[0]._id, { archived: true })

      await mockLoginAs(users.globalAdmin)

      const getHandler = require('@pages/api/domain/index').default

      const mockReq = {
        method: 'GET',
        query: { archived: 'true' },
      } as any
      const mockRes = {
        status: jest.fn(() => mockRes),
        json: jest.fn(),
      } as any

      await getHandler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      const ids = mockRes.json.mock.lastCall[0].data.map((d: any) => d._id.toString())
      expect(ids).toContain(domains[0]._id.toString())
    })
  })
})