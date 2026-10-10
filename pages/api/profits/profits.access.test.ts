import { expect } from '@jest/globals'
import mongoose from 'mongoose'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, profits, realEstates, users } from '@utils/testData'
import Profit from '@modules/models/Profit'
import listHandler from './index'
import idHandler from './[id]'
import domainHandler from './domain/[domainId]'
import bulkHandler from './bulk'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

// domainAdmin runs domains[0] only. realEstates[0] sits in domains[0] but is
// administered by `users.user`, not by the domain admin. (testData sorts
// `profits` by date, so records are picked by domain, not by index.)
const ownDomain = domains[0]._id
const foreignDomain = domains[1]._id
const recordIn = (domain: string) => profits.find((p) => p.domain === domain)
const ownRecord = recordIn(ownDomain)._id
const foreignRecord = recordIn(foreignDomain)._id

type Handler = (req: any, res: any) => Promise<unknown>

async function call(
  handler: Handler,
  as: { email: string; roles: any[] },
  req: Record<string, unknown>
) {
  await mockLoginAs(as)
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn()
  res.end = jest.fn()
  await handler({ query: {}, ...req }, res)
  return {
    status: res.status.mock.lastCall?.[0],
    body: res.json.mock.lastCall?.[0],
  }
}

const expense = (target: Record<string, unknown>) => ({
  ...target,
  type: 'debit',
  date: new Date().toISOString(),
  items: [{ category: 'Матеріали', amount: 500 }],
})

describe('Profit API access by ledger', () => {
  describe('GET /api/profits (every domain)', () => {
    it('403 for a DomainAdmin', async () => {
      const { status } = await call(listHandler, users.domainAdmin, {
        method: 'GET',
      })
      expect(status).toBe(403)
    })

    it('200 for a GlobalAdmin', async () => {
      const { status } = await call(listHandler, users.globalAdmin, {
        method: 'GET',
      })
      expect(status).toBe(200)
    })
  })

  describe('POST /api/profits', () => {
    it('200 into a domain the DomainAdmin runs', async () => {
      const { status } = await call(listHandler, users.domainAdmin, {
        method: 'POST',
        body: expense({ domain: ownDomain }),
      })
      expect(status).toBe(200)
    })

    it('403 into a foreign domain, and nothing is written', async () => {
      const before = await Profit.countDocuments()

      const { status } = await call(listHandler, users.domainAdmin, {
        method: 'POST',
        body: expense({ domain: foreignDomain }),
      })

      expect(status).toBe(403)
      expect(await Profit.countDocuments()).toBe(before)
    })

    it('403 into a company of their domain they do not administer', async () => {
      const { status } = await call(listHandler, users.domainAdmin, {
        method: 'POST',
        body: expense({ company: realEstates[0]._id }),
      })
      expect(status).toBe(403)
    })

    it('200 into any domain for a GlobalAdmin', async () => {
      const { status } = await call(listHandler, users.globalAdmin, {
        method: 'POST',
        body: expense({ domain: foreignDomain }),
      })
      expect(status).toBe(200)
    })
  })

  describe('/api/profits/:id', () => {
    it.each(['GET', 'DELETE'])(
      '%s 403 for a record of a foreign domain',
      async (method) => {
        const { status } = await call(idHandler, users.domainAdmin, {
          method,
          query: { id: foreignRecord },
        })
        expect(status).toBe(403)
        expect(await Profit.exists({ _id: foreignRecord })).toBeTruthy()
      }
    )

    it('PATCH 403 for a record of a foreign domain, which stays unchanged', async () => {
      const { status } = await call(idHandler, users.domainAdmin, {
        method: 'PATCH',
        query: { id: foreignRecord },
        body: { amount: 1 },
      })

      expect(status).toBe(403)
      const record = await Profit.findById(foreignRecord).lean()
      expect(record.amount).toBe(recordIn(foreignDomain).amount)
    })

    it('403, not 404, for an id that does not exist', async () => {
      const { status } = await call(idHandler, users.domainAdmin, {
        method: 'GET',
        query: { id: new mongoose.Types.ObjectId().toString() },
      })
      expect(status).toBe(403)
    })

    it('GET 200 for a record of their own domain', async () => {
      const { status, body } = await call(idHandler, users.domainAdmin, {
        method: 'GET',
        query: { id: ownRecord },
      })
      expect(status).toBe(200)
      expect(body.data._id.toString()).toBe(ownRecord)
    })

    it('DELETE 200 for a record of their own domain', async () => {
      const { status } = await call(idHandler, users.domainAdmin, {
        method: 'DELETE',
        query: { id: ownRecord },
      })
      expect(status).toBe(200)
      expect(await Profit.exists({ _id: ownRecord })).toBeNull()
    })

    it('PATCH 403 when moving their record into a foreign domain', async () => {
      const { status } = await call(idHandler, users.domainAdmin, {
        method: 'PATCH',
        query: { id: ownRecord },
        body: { domain: foreignDomain },
      })

      expect(status).toBe(403)
      const record = await Profit.findById(ownRecord).lean()
      expect(record.domain.toString()).toBe(ownDomain)
    })

    it('PATCH ignores fields that are not editable', async () => {
      const intruder = new mongoose.Types.ObjectId()
      const { status } = await call(idHandler, users.domainAdmin, {
        method: 'PATCH',
        query: { id: ownRecord },
        body: { description: 'ok', createdBy: intruder, payment: intruder },
      })

      expect(status).toBe(200)
      const record = await Profit.findById(ownRecord).lean()
      expect(record.description).toBe('ok')
      expect(record.createdBy?.toString()).not.toBe(intruder.toString())
      expect(record.payment?.toString()).not.toBe(intruder.toString())
    })

    it('PATCH moving a record to a company leaves exactly one scope', async () => {
      const { status } = await call(idHandler, users.globalAdmin, {
        method: 'PATCH',
        query: { id: ownRecord },
        body: { company: realEstates[0]._id },
      })

      expect(status).toBe(200)
      const record = await Profit.findById(ownRecord).lean()
      expect(record.company.toString()).toBe(realEstates[0]._id)
      expect(record.domain).toBeUndefined()
    })

    it('PATCH 400 for both domain and company', async () => {
      const { status } = await call(idHandler, users.globalAdmin, {
        method: 'PATCH',
        query: { id: ownRecord },
        body: { domain: ownDomain, company: realEstates[0]._id },
      })
      expect(status).toBe(400)
    })
  })

  describe('GET /api/profits/domain/:domainId', () => {
    it('200 for their own domain', async () => {
      const { status } = await call(domainHandler, users.domainAdmin, {
        method: 'GET',
        query: { domainId: ownDomain },
      })
      expect(status).toBe(200)
    })

    it('403 for a foreign domain', async () => {
      const { status } = await call(domainHandler, users.domainAdmin, {
        method: 'GET',
        query: { domainId: foreignDomain },
      })
      expect(status).toBe(403)
    })
  })

  describe('POST /api/profits/bulk', () => {
    it('400 for one bad record, and writes none of them', async () => {
      const before = await Profit.countDocuments()

      const { status, body } = await call(bulkHandler, users.globalAdmin, {
        method: 'POST',
        body: [
          expense({ domain: ownDomain }),
          { ...expense({ domain: ownDomain }), type: 'gift' },
        ],
      })

      expect(status).toBe(400)
      expect(body.message).toMatch(/^records\[1\]/)
      expect(await Profit.countDocuments()).toBe(before)
    })

    it('derives amounts from items and stamps the creator', async () => {
      const { status, body } = await call(bulkHandler, users.globalAdmin, {
        method: 'POST',
        body: [expense({ domain: ownDomain })],
      })

      expect(status).toBe(200)
      const record = await Profit.findById(body.data[0]._id).lean()
      expect(record.amount).toBe(500)
      expect(record.createdBy).toBeTruthy()
    })
  })
})
