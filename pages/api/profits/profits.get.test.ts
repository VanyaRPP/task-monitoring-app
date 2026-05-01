import { expect } from '@jest/globals'
if (typeof global.fetch === 'undefined') 
  global.fetch = jest.fn() as any
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { profits, users, domains } from '@utils/testData'
import listHandler from './index'
import idHandler from './[id]'
import domainHandler from './domain/[domainId]'
import balanceHandler from './balance/[domainId]'
import bulkHandler from './bulk'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

function createMockRes() {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn()
  return res
}

function extractDocs(data: any): any[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') return Object.values(data).flat()
  return []
}

function idsOf(arr: any[]): string[] {
  return arr.map((d) => d._id.toString())
}

const descProfits = [...profits].sort(
  (a, b) => b.date.getTime() - a.date.getTime()
)

describe('Profits API – GET /api/profits', () => {
  it('returns 403 for user without roles', async () => {
    await mockLoginAs(users.noRoleUser)
    const mockReq = { method: 'GET', query: {} } as any
    const mockRes = createMockRes()

    await listHandler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(403)
  })

  describe('as GlobalAdmin', () => {
    beforeEach(async () => {
      await mockLoginAs(users.globalAdmin)
    })

    const errorCases = [
      { page: 'false', limit: 'false' },
      { page: 'null', limit: 'null' },
      { page: 'foo', limit: 'foo' },
      { page: '0', limit: '0' },
    ]

    errorCases.forEach(({ page, limit }) => {
      it(`page=${page} & limit=${limit} ⇒ 500`, async () => {
        const mockReq = { method: 'GET', query: { page, limit } } as any
        const mockRes = createMockRes()

        await listHandler(mockReq, mockRes)
        expect(mockRes.status).toHaveBeenCalledWith(500)
      })
    })

    it('returns all profits with default pagination', async () => {
      const mockReq = { method: 'GET', query: {} } as any
      const mockRes = createMockRes()

      await listHandler(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(200)

      const body = mockRes.json.mock.lastCall[0]
      const docs = extractDocs(body.data)
      expect(idsOf(docs)).toEqual(idsOf(descProfits))
      expect(body.meta).toEqual({
        total: profits.length,
        page: 1,
        limit: 10,
        totalPages: Math.ceil(profits.length / 10),
      })
    })

    it('page=1 & limit=2 returns first two records', async () => {
      const mockReq = { method: 'GET', query: { page: '1', limit: '2' } } as any
      const mockRes = createMockRes()

      await listHandler(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(200)

      const data = extractDocs(mockRes.json.mock.lastCall[0].data)
      expect(idsOf(data)).toEqual(idsOf(descProfits.slice(0, 2)))
    })

    it('page=2 & limit=1 returns second record', async () => {
      const mockReq = { method: 'GET', query: { page: '2', limit: '1' } } as any
      const mockRes = createMockRes()

      await listHandler(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(200)

      const data = extractDocs(mockRes.json.mock.lastCall[0].data)
      expect(idsOf(data)).toEqual([descProfits[1]._id.toString()])
    })
  })
})

describe('Profits API – GET /api/profits/:id (getProfitById)', () => {
  const route = { method: 'GET' } as any

  it('returns 403 if not globalAdmin', async () => {
    await mockLoginAs(users.user)
    const mockReq = { ...route, query: { id: descProfits[0]._id.toString() } }
    const mockRes = createMockRes()

    await idHandler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(403)
  })

  describe('as GlobalAdmin', () => {
    beforeEach(async () => {
      await mockLoginAs(users.globalAdmin)
    })

    const invalidIds = ['undefined', 'false', 'null', '0', '']
    invalidIds.forEach((id) => {
      it(`id=${String(id)} ⇒ 500`, async () => {
        const mockReq = { ...route, query: id != null ? { id } : {} } as any
        const mockRes = createMockRes()

        await idHandler(mockReq, mockRes)
        expect(mockRes.status).toHaveBeenCalledWith(500)
      })
    })

    it('valid id ⇒ 200 + correct record', async () => {
      const validId = descProfits[0]._id.toString()
      const mockReq = { ...route, query: { id: validId } } as any
      const mockRes = createMockRes()

      await idHandler(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(200)

      const body = mockRes.json.mock.lastCall[0]
      expect(body.data._id.toString()).toEqual(validId)
    })
  })
})

describe('Profits API – GET /api/profits/domain/:domainId (getByDomain)', () => {
  const route = { method: 'GET' } as any

  it('returns 403 if not admin', async () => {
    await mockLoginAs(users.user)
    const mockReq = { ...route, query: { domainId: domains[0]._id.toString() } }
    const mockRes = createMockRes()

    await domainHandler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(403)
  })

  describe('as Admin', () => {
    beforeEach(async () => {
      await mockLoginAs(users.globalAdmin)
    })

    const invalid = ['undefined', 'false', 'null', '0', '']
    invalid.forEach((domainId) => {
      it(`domainId=${String(domainId)} ⇒ 500`, async () => {
        const mockReq = {
          ...route,
          query: domainId != null ? { domainId } : {},
        } as any
        const mockRes = createMockRes()

        await domainHandler(mockReq, mockRes)
        expect(mockRes.status).toHaveBeenCalledWith(500)
      })
    })

    it('valid domainId ⇒ 200 + filtered data', async () => {
      const validDomain = domains[0]._id.toString()
      const mockReq = { ...route, query: { domainId: validDomain } } as any
      const mockRes = createMockRes()

      await domainHandler(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(200)

      const docs = extractDocs(mockRes.json.mock.lastCall[0].data)
      expect(docs.every((d) => d.domain.toString() === validDomain)).toBe(true)
    })
  })
})

describe('Profits API – GET /api/profits/balance/:domainId (getBalance)', () => {
  const route = { method: 'GET' } as any

  it('returns 403 if not globalAdmin', async () => {
    await mockLoginAs(users.user)
    const mockReq = { ...route, query: { domainId: domains[0]._id.toString() } }
    const mockRes = createMockRes()

    await balanceHandler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(403)
  })

  describe('as GlobalAdmin', () => {
    beforeEach(async () => {
      await mockLoginAs(users.globalAdmin)
    })

    const invalid = ['undefined', 'false', 'null', '0', '']
    invalid.forEach((domainId) => {
      it(`domainId=${String(domainId)} ⇒ 500`, async () => {
        const mockReq = {
          ...route,
          query: domainId != null ? { domainId } : {},
        } as any
        const mockRes = createMockRes()

        await balanceHandler(mockReq, mockRes)
        expect(mockRes.status).toHaveBeenCalledWith(500)
      })
    })

    it('valid domainId ⇒ 200 + numeric balance', async () => {
      const validDomain = domains[0]._id.toString()
      const mockReq = { ...route, query: { domainId: validDomain } } as any
      const mockRes = createMockRes()

      await balanceHandler(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(200)

      const body = mockRes.json.mock.lastCall[0]
      expect(typeof body.data.balance).toBe('number')
    })
  })

  describe('POST /api/profits', () => {
    it('403 for non-admin', async () => {
      await mockLoginAs(users.user)
      const req = { method: 'POST', body: {} } as any
      const res = createMockRes()
      await listHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(403)
    })

    describe('as GlobalAdmin', () => {
      beforeEach(async () => {
        await mockLoginAs(users.globalAdmin)
      })

      it('400 when missing required fields', async () => {
        const req = { method: 'POST', body: { amount: 100 } } as any
        const res = createMockRes()
        await listHandler(req, res)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json.mock.lastCall[0].error).toMatch(
          /Missing required fields/
        )
      })

      it('400 when invalid type', async () => {
        const payload = {
          domain: domains[0]._id.toString(),
          amount: 50,
          type: 'foo',
          date: new Date().toISOString(),
        }
        const req = { method: 'POST', body: payload } as any
        const res = createMockRes()
        await listHandler(req, res)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json.mock.lastCall[0].error).toMatch(/Invalid type/)
      })

      it('200 + returns created record', async () => {
        const payload = {
          domain: domains[0]._id.toString(),
          amount: 123,
          type: 'credit',
          date: new Date().toISOString(),
        }
        const req = { method: 'POST', body: payload } as any
        const res = createMockRes()
        await listHandler(req, res)
        expect(res.status).toHaveBeenCalledWith(200)

        const body = res.json.mock.lastCall[0]
        expect(body.success).toBe(true)
        expect(body.data.domain.toString()).toEqual(payload.domain)
        expect(body.data.amount).toBe(payload.amount)
        expect(body.data.type).toBe(payload.type)
      })
    })
  })

  describe('POST /api/profits/bulk', () => {
    it('403 for non-globalAdmin', async () => {
      await mockLoginAs(users.user)
      const req = { method: 'POST', body: [] } as any
      const res = createMockRes()
      await bulkHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(403)
    })

    describe('as GlobalAdmin', () => {
      beforeEach(async () => {
        await mockLoginAs(users.globalAdmin)
      })

      it('400 when body is not an array', async () => {
        const req = { method: 'POST', body: { foo: 'bar' } } as any
        const res = createMockRes()
        await bulkHandler(req, res)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json.mock.lastCall[0].message).toMatch(
          /Expected array of records/
        )
      })

      it('200 + returns array of created profits', async () => {
        const items = profits.slice(0, 2).map((p) => ({
          domain: p.domain.toString(),
          amount: p.amount,
          type: p.type,
          date: p.date.toISOString(),
        }))
        const req = { method: 'POST', body: items } as any
        const res = createMockRes()
        await bulkHandler(req, res)
        expect(res.status).toHaveBeenCalledWith(200)

        const body = res.json.mock.lastCall[0]
        expect(body.success).toBe(true)
        expect(Array.isArray(body.data)).toBe(true)
        expect(body.data).toHaveLength(items.length)
        expect(body.data[0].domain.toString()).toEqual(items[0].domain)
        expect(body.data[0].amount).toBe(items[0].amount)
      })
    })
  })
  describe('PATCH /api/profits/:id', () => {
    it('403 for non-globalAdmin', async () => {
      await mockLoginAs(users.user)
      const req = {
        method: 'PATCH',
        query: { id: descProfits[0]._id.toString() },
        body: { amount: 999 },
      } as any
      const res = createMockRes()
      await idHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(403)
    })

    describe('as GlobalAdmin', () => {
      beforeEach(async () => {
        await mockLoginAs(users.globalAdmin)
      })

      it('500 for invalid id', async () => {
        const req = {
          method: 'PATCH',
          query: { id: 'invalid' },
          body: { amount: 1000 },
        } as any
        const res = createMockRes()
        await idHandler(req, res)
        expect(res.status).toHaveBeenCalledWith(500)
      })

      it('200 + updates record', async () => {
        const validId = descProfits[0]._id.toString()
        const req = {
          method: 'PATCH',
          query: { id: validId },
          body: { amount: 1234 },
        } as any
        const res = createMockRes()
        await idHandler(req, res)
        expect(res.status).toHaveBeenCalledWith(200)
        const body = res.json.mock.lastCall[0]
        expect(body.data._id.toString()).toEqual(validId)
        expect(body.data.amount).toBe(1234)
      })
    })
  })

  describe('DELETE /api/profits/:id', () => {
    it('403 for non-globalAdmin', async () => {
      await mockLoginAs(users.user)
      const req = {
        method: 'DELETE',
        query: { id: descProfits[0]._id.toString() },
      } as any
      const res = createMockRes()
      await idHandler(req, res)
      expect(res.status).toHaveBeenCalledWith(403)
    })

    describe('as GlobalAdmin', () => {
      beforeEach(async () => {
        await mockLoginAs(users.globalAdmin)
      })

      it('500 for invalid id', async () => {
        const req = { method: 'DELETE', query: { id: 'invalid' } } as any
        const res = createMockRes()
        await idHandler(req, res)
        expect(res.status).toHaveBeenCalledWith(500)
      })

      it('200 + success true', async () => {
        const validId = descProfits[1]._id.toString()
        const req = { method: 'DELETE', query: { id: validId } } as any
        const res = createMockRes()
        await idHandler(req, res)
        expect(res.status).toHaveBeenCalledWith(200)
        const body = res.json.mock.lastCall[0]
        expect(body.success).toBe(true)
      })
    })
  })
})
