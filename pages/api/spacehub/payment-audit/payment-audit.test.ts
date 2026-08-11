import { expect } from '@jest/globals'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, users } from '@utils/testData'
import handler from '.'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import Payment from '@common/modules/models/Payment'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

// domains[0] -> domainAdmin, domains[6] -> domainAdmin2, domains[1] -> nobody.
const ownDomain = domains[0]._id
const otherAdminDomain = domains[6]._id
const orphanDomain = domains[1]._id

const baseInvoiceData = {
  invoiceNumber: 1,
  invoiceCreationDate: new Date('2024-01-01'),
  invoice: [],
  provider: { description: 'p' },
  reciever: { companyName: 'c', adminEmails: [], description: 'd' },
  generalSum: 100,
  type: 'debit',
}

const makeLog = (overrides: Record<string, any> = {}) => ({
  paymentId: new mongoose.Types.ObjectId(),
  date: new Date('2024-01-01'),
  actionType: 'CREATE',
  source: 'single',
  actorEmail: 'someone@example.com',
  invoiceData: { ...baseInvoiceData },
  ...overrides,
})

const seedLogs = [
  makeLog({
    domainId: ownDomain,
    actionType: 'CREATE',
    source: 'single',
    actorEmail: 'alice@example.com',
    date: new Date('2024-01-10'),
  }),
  makeLog({
    domainId: ownDomain,
    actionType: 'DELETE',
    source: 'single',
    actorEmail: 'bob@example.com',
    date: new Date('2024-02-10'),
  }),
  makeLog({
    domainId: otherAdminDomain,
    actionType: 'CREATE',
    source: 'bulk',
    actorEmail: 'alice@example.com',
    date: new Date('2024-03-10'),
  }),
  makeLog({
    domainId: orphanDomain,
    actionType: 'MARK_PAID',
    source: 'quick-pay',
    actorEmail: 'carol@example.com',
    date: new Date('2024-04-10'),
  }),
  makeLog({
    actionType: 'UPDATE',
    source: 'single',
    actorEmail: 'dave@example.com',
    date: new Date('2024-05-10'),
  }),
]

const performRequest = async (query: Record<string, any> = {}) => {
  const mockReq = { method: 'GET', query } as any
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  } as any
  await handler(mockReq, mockRes)
  return mockRes
}

const jsonOf = (res: any) => (res.json as jest.Mock).mock.calls[0][0]

describe('Payment Audit API - GET', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockReset()
    await (PaymentChangeLog as any).insertMany(seedLogs)
  })

  it('rejects non-GET methods with 405', async () => {
    const mockReq = { method: 'POST', query: {} } as any
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any
    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(405)
  })

  it('returns 401 when the session has no matching user', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: 'ghost@example.com' },
    })
    const res = await performRequest({})
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('returns 403 for a regular user', async () => {
    await mockLoginAs(users.user)
    const res = await performRequest({})
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('GLOBAL_ADMIN sees all logs, newest first', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest({})

    expect(res.status).toHaveBeenCalledWith(200)
    const body = jsonOf(res)
    expect(body.total).toBe(5)
    expect(body.data).toHaveLength(5)
    expect(body.data[0].actionType).toBe('UPDATE')
    expect(body.data[body.data.length - 1].actionType).toBe('CREATE')
  })

  it('resolves the domain name for entries that carry a domainId', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest({ domainId: ownDomain })

    const body = jsonOf(res)
    expect(body.data.length).toBeGreaterThan(0)
    expect(body.data.every((l: any) => l.domainName === 'domain 0')).toBe(true)
  })

  it('resolves the company name from the snapshot', async () => {
    await mockLoginAs(users.globalAdmin)
    const company = realEstates[0]
    await PaymentChangeLog.create(
      makeLog({
        domainId: ownDomain,
        actionType: 'DELETE',
        source: 'single',
        actorEmail: 'zoe@example.com',
        before: { _id: 'snap', company: company._id, type: 'debit' },
      })
    )

    const res = await performRequest({ actorEmail: 'zoe@example.com' })
    const body = jsonOf(res)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].companyName).toBe(company.companyName)
  })

  it('DOMAIN_ADMIN sees only logs from their own domains', async () => {
    await mockLoginAs(users.domainAdmin)
    const res = await performRequest({})

    expect(res.status).toHaveBeenCalledWith(200)
    const body = jsonOf(res)
    expect(body.total).toBe(2)
    expect(
      body.data.every((l: any) => l.domainId?.toString() === ownDomain)
    ).toBe(true)
  })

  it('a different DOMAIN_ADMIN sees only their own domain', async () => {
    await mockLoginAs(users.domainAdmin2)
    const res = await performRequest({})

    const body = jsonOf(res)
    expect(body.total).toBe(1)
    expect(body.data[0].domainId?.toString()).toBe(otherAdminDomain)
  })

  it('DOMAIN_ADMIN cannot widen scope via a foreign domainId filter', async () => {
    await mockLoginAs(users.domainAdmin)
    const res = await performRequest({ domainId: orphanDomain })

    const body = jsonOf(res)
    // foreign domainId is ignored; still only their own domain logs
    expect(body.total).toBe(2)
  })

  it('DOMAIN_ADMIN can narrow to one of their own domains', async () => {
    await mockLoginAs(users.domainAdmin)
    const res = await performRequest({ domainId: ownDomain })

    const body = jsonOf(res)
    expect(body.total).toBe(2)
  })

  it('filters by actionType', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest({ actionType: 'CREATE' })

    const body = jsonOf(res)
    expect(body.total).toBe(2)
    expect(body.data.every((l: any) => l.actionType === 'CREATE')).toBe(true)
  })

  it('filters by multiple actionTypes (array)', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest({ actionType: ['CREATE', 'DELETE'] })

    const body = jsonOf(res)
    expect(body.total).toBe(3)
  })

  it('filters by source', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest({ source: 'bulk' })

    const body = jsonOf(res)
    expect(body.total).toBe(1)
    expect(body.data[0].source).toBe('bulk')
  })

  it('filters by actorEmail (case-insensitive, partial)', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest({ actorEmail: 'ALICE' })

    const body = jsonOf(res)
    expect(body.total).toBe(2)
    expect(body.data.every((l: any) => /alice/i.test(l.actorEmail))).toBe(true)
  })

  it('filters by date range (from/to)', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest({
      from: '2024-03-01',
      to: '2024-04-30',
    })

    const body = jsonOf(res)
    // 2024-03-10 (bulk) + 2024-04-10 (mark-paid)
    expect(body.total).toBe(2)
  })

  it('paginates results', async () => {
    await mockLoginAs(users.globalAdmin)
    const page1 = await performRequest({ limit: 2, page: 1 })
    const body1 = jsonOf(page1)
    expect(body1.total).toBe(5)
    expect(body1.data).toHaveLength(2)

    await mockLoginAs(users.globalAdmin)
    const page3 = await performRequest({ limit: 2, page: 3 })
    const body3 = jsonOf(page3)
    expect(body3.total).toBe(5)
    expect(body3.data).toHaveLength(1)
  })

  it('filters by invoice type (credit)', async () => {
    await mockLoginAs(users.globalAdmin)
    await PaymentChangeLog.create(
      makeLog({
        domainId: ownDomain,
        actorEmail: 'credit@example.com',
        invoiceData: { ...baseInvoiceData, type: 'credit' },
      })
    )

    const res = await performRequest({ type: 'credit' })
    const body = jsonOf(res)
    expect(body.total).toBe(1)
    expect(body.data[0].invoiceData.type).toBe('credit')
  })

  it('filters by company', async () => {
    await mockLoginAs(users.globalAdmin)
    const company = realEstates[0]
    await PaymentChangeLog.create(
      makeLog({
        domainId: ownDomain,
        companyId: new mongoose.Types.ObjectId(company._id),
        actorEmail: 'co@example.com',
      })
    )

    const res = await performRequest({ companyId: company._id })
    const body = jsonOf(res)
    expect(body.total).toBe(1)
    expect(body.data[0].companyId?.toString()).toBe(company._id)
  })

  it('fills invoiceData.currency from the live payment when the snapshot lacks it', async () => {
    await mockLoginAs(users.globalAdmin)
    const paymentId = new mongoose.Types.ObjectId()
    await Payment.create({
      _id: paymentId,
      invoiceNumber: 5,
      type: 'debit',
      invoiceCreationDate: new Date('2024-01-01'),
      domain: ownDomain,
      currency: 'USD',
      invoice: [],
      provider: { description: 'p' },
      reciever: { companyName: 'c', adminEmails: [], description: 'd' },
      generalSum: 100,
    })
    await PaymentChangeLog.create(
      makeLog({ paymentId, domainId: ownDomain, actorEmail: 'usd@example.com' })
    )

    const res = await performRequest({ actorEmail: 'usd@example.com' })
    const body = jsonOf(res)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].invoiceData.currency).toBe('USD')
  })

  it('combines type + actionType filters', async () => {
    await mockLoginAs(users.globalAdmin)
    await PaymentChangeLog.create(
      makeLog({
        domainId: ownDomain,
        actionType: 'DELETE',
        actorEmail: 'combo@example.com',
        invoiceData: { ...baseInvoiceData, type: 'credit' },
      })
    )

    const res = await performRequest({ type: 'credit', actionType: 'DELETE' })
    const body = jsonOf(res)
    expect(body.total).toBe(1)
    expect(body.data[0].actorEmail).toBe('combo@example.com')
  })
})
