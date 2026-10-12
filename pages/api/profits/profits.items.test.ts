import { expect } from '@jest/globals'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users } from '@utils/testData'
import Profit from '@modules/models/Profit'
import listHandler from './index'
import idHandler from './[id]'
import domainHandler from './domain/[domainId]'

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

const domainId = domains[0]._id.toString()

const receipt = [
  { category: 'Прибирання', amount: 2600, description: '13 × 200' },
  { category: 'Корпоратив', amount: 3700, description: 'суші, піца' },
  { category: 'Кава-чай', amount: 300, description: 'цукерки' },
  { category: 'Матеріали', amount: 500, description: 'віск' },
  { category: 'Доставка', amount: 145, description: 'посилка косметики' },
]

// mockLoginAs covers one request only, so each helper logs in itself.
async function post(body: Record<string, unknown>) {
  await mockLoginAs(users.globalAdmin)
  const res = createMockRes()
  await listHandler({ method: 'POST', body } as any, res)
  return {
    status: res.status.mock.lastCall[0],
    body: res.json.mock.lastCall[0],
  }
}

async function patch(id: string, body: Record<string, unknown>) {
  await mockLoginAs(users.globalAdmin)
  const res = createMockRes()
  await idHandler({ method: 'PATCH', query: { id }, body } as any, res)
  return {
    status: res.status.mock.lastCall[0],
    body: res.json.mock.lastCall[0],
  }
}

describe('Profit items', () => {
  describe('POST /api/profits', () => {
    it('stores the lines and takes amount and categories from them', async () => {
      const { status, body } = await post({
        domain: domainId,
        type: 'debit',
        date: new Date().toISOString(),
        // A client total that disagrees must not win.
        amount: 1,
        categories: ['ignored'],
        items: receipt,
      })

      expect(status).toBe(200)
      const saved = await Profit.findById(body.data._id).lean()
      expect(saved.amount).toBe(7245)
      expect(saved.categories).toEqual([
        'Прибирання',
        'Корпоратив',
        'Кава-чай',
        'Матеріали',
        'Доставка',
      ])
      expect(saved.items).toEqual(receipt)
    })

    it('needs no amount when items are sent', async () => {
      const { status, body } = await post({
        domain: domainId,
        type: 'debit',
        date: new Date().toISOString(),
        items: [{ category: 'Матеріали', amount: 500 }],
      })

      expect(status).toBe(200)
      expect(body.data.amount).toBe(500)
    })

    it('400 for a line with a non-positive amount, and saves nothing', async () => {
      const before = await Profit.countDocuments()

      const { status, body } = await post({
        domain: domainId,
        type: 'debit',
        date: new Date().toISOString(),
        items: [{ category: 'Прибирання', amount: -2600 }],
      })

      expect(status).toBe(400)
      expect(body.error).toMatch(/items\[0\]\.amount/)
      expect(await Profit.countDocuments()).toBe(before)
    })

    it('keeps a record without items as before', async () => {
      const { status, body } = await post({
        domain: domainId,
        type: 'credit',
        date: new Date().toISOString(),
        amount: 123,
        categories: ['Оренда'],
      })

      expect(status).toBe(200)
      const saved = await Profit.findById(body.data._id).lean()
      expect(saved.amount).toBe(123)
      expect(saved.categories).toEqual(['Оренда'])
      expect(saved.items).toBeUndefined()
    })
  })

  describe('PATCH /api/profits/:id', () => {
    it('replaces the lines and recomputes amount and categories', async () => {
      const created = await post({
        domain: domainId,
        type: 'debit',
        date: new Date().toISOString(),
        items: receipt,
      })

      const { status } = await patch(created.body.data._id, {
        amount: 1,
        items: [
          { category: 'Прибирання', amount: 2600 },
          { category: 'Матеріали', amount: 500.5 },
        ],
      })

      expect(status).toBe(200)
      const saved = await Profit.findById(created.body.data._id).lean()
      expect(saved.amount).toBe(3100.5)
      expect(saved.categories).toEqual(['Прибирання', 'Матеріали'])
      expect(saved.items).toHaveLength(2)
    })

    it('400 for invalid lines and leaves the record alone', async () => {
      const created = await post({
        domain: domainId,
        type: 'debit',
        date: new Date().toISOString(),
        items: receipt,
      })

      const { status } = await patch(created.body.data._id, { items: [] })

      expect(status).toBe(400)
      const saved = await Profit.findById(created.body.data._id).lean()
      expect(saved.amount).toBe(7245)
    })
  })

  it('returns the lines in the domain ledger', async () => {
    const created = await post({
      domain: domainId,
      type: 'debit',
      date: new Date().toISOString(),
      items: receipt,
    })

    await mockLoginAs(users.globalAdmin)
    const res = createMockRes()
    await domainHandler({ method: 'GET', query: { domainId } } as any, res)

    expect(res.status).toHaveBeenCalledWith(200)
    const transactions = Object.values(res.json.mock.lastCall[0].data).flatMap(
      (ledger: any) => ledger.transactions
    )
    const record = transactions.find(
      (t: any) => t._id.toString() === created.body.data._id.toString()
    )
    expect(record.items).toEqual(receipt)
  })
})
