import { expect } from '@jest/globals'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users } from '@utils/testData'
import handler from './restore'
import Payment from '@common/modules/models/Payment'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

const ownDomainId = domains[0]._id
const foreignDomainId = domains[6]._id

const baseInvoiceData = {
  invoiceNumber: 7777,
  invoiceCreationDate: new Date('2024-01-01'),
  invoice: [],
  provider: { description: 'p' },
  reciever: { companyName: 'c', adminEmails: [], description: 'd' },
  generalSum: 500,
  type: 'debit',
}

const makeSnapshot = (id: string, domainId: string) => ({
  _id: id,
  invoiceNumber: 7777,
  type: 'debit',
  invoiceCreationDate: new Date('2024-01-01'),
  domain: domainId,
  invoice: [],
  provider: { description: 'p' },
  reciever: { companyName: 'c', adminEmails: [], description: 'd' },
  generalSum: 500,
})

const createDeleteLog = async ({
  paymentId,
  domainId,
  actionType = 'DELETE',
}: {
  paymentId: string
  domainId: string
  actionType?: string
}) => {
  const log = await PaymentChangeLog.create({
    paymentId,
    actionType,
    source: actionType === 'BULK_DELETE' ? 'bulk' : 'single',
    date: new Date('2024-02-01'),
    actorEmail: 'admin@example.com',
    domainId,
    before: makeSnapshot(paymentId, domainId),
    invoiceData: { ...baseInvoiceData },
  })
  return log
}

const performRequest = async (logId: any) => {
  const mockReq = { method: 'POST', query: { logId: String(logId) } } as any
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  } as any
  await handler(mockReq, mockRes)
  return mockRes
}

const jsonOf = (res: any) => (res.json as jest.Mock).mock.calls[0][0]

describe('Payment Audit API - restore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockReset()
  })

  it('rejects non-POST methods with 405', async () => {
    const mockReq = { method: 'GET', query: { logId: 'x' } } as any
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any
    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(405)
  })

  it('returns 403 for a regular user', async () => {
    await mockLoginAs(users.user)
    const paymentId = new mongoose.Types.ObjectId().toString()
    const log = await createDeleteLog({ paymentId, domainId: ownDomainId })
    const res = await performRequest(log._id)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('returns 404 when the log does not exist', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest(new mongoose.Types.ObjectId().toString())
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('happy path: GLOBAL_ADMIN restores a deleted payment with its original _id', async () => {
    await mockLoginAs(users.globalAdmin)
    const paymentId = new mongoose.Types.ObjectId().toString()
    const log = await createDeleteLog({ paymentId, domainId: ownDomainId })

    const res = await performRequest(log._id)

    expect(res.status).toHaveBeenCalledWith(201)
    const body = jsonOf(res)
    expect(body.success).toBe(true)
    expect(body.data._id.toString()).toBe(paymentId)

    const restored = await Payment.findById(paymentId)
    expect(restored).not.toBeNull()
    expect(restored?.invoiceNumber).toBe(7777)

    const restoreLog = await PaymentChangeLog.findOne({
      paymentId,
      actionType: 'RESTORE',
    })
    expect(restoreLog).not.toBeNull()
    expect(restoreLog?.source).toBe('admin-restore')
  })

  it('happy path: BULK_DELETE entries are also restorable', async () => {
    await mockLoginAs(users.globalAdmin)
    const paymentId = new mongoose.Types.ObjectId().toString()
    const log = await createDeleteLog({
      paymentId,
      domainId: ownDomainId,
      actionType: 'BULK_DELETE',
    })

    const res = await performRequest(log._id)

    expect(res.status).toHaveBeenCalledWith(201)
    const restored = await Payment.findById(paymentId)
    expect(restored).not.toBeNull()
  })

  it('returns 400 for a non-restorable log (e.g. MARK_PAID)', async () => {
    await mockLoginAs(users.globalAdmin)
    const paymentId = new mongoose.Types.ObjectId().toString()
    const log = await createDeleteLog({
      paymentId,
      domainId: ownDomainId,
      actionType: 'MARK_PAID',
    })

    const res = await performRequest(log._id)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('UPDATE restore reverts the payment to its before-state and logs a RESTORE', async () => {
    await mockLoginAs(users.globalAdmin)
    const paymentId = new mongoose.Types.ObjectId().toString()

    await Payment.create({
      _id: paymentId,
      invoiceNumber: 7777,
      type: 'debit',
      invoiceCreationDate: new Date('2024-01-01'),
      domain: ownDomainId,
      generalSum: 999,
      invoice: [],
      provider: { description: 'p' },
      reciever: { companyName: 'c', adminEmails: [], description: 'd' },
    })

    const log = await createDeleteLog({
      paymentId,
      domainId: ownDomainId,
      actionType: 'UPDATE',
    })

    const res = await performRequest(log._id)

    expect(res.status).toHaveBeenCalledWith(200)

    const reverted = await Payment.findById(paymentId)
    expect(reverted?.generalSum).toBe(500)

    const restoreLog = await PaymentChangeLog.findOne({
      paymentId,
      actionType: 'RESTORE',
      source: 'admin-restore',
    })
    expect(restoreLog).not.toBeNull()
  })

  it('forbids a DOMAIN_ADMIN from reverting an UPDATE in a foreign domain', async () => {
    await mockLoginAs(users.domainAdmin)
    const paymentId = new mongoose.Types.ObjectId().toString()
    const log = await createDeleteLog({
      paymentId,
      domainId: foreignDomainId,
      actionType: 'UPDATE',
    })

    const res = await performRequest(log._id)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('returns 409 when a payment with that _id already exists', async () => {
    await mockLoginAs(users.globalAdmin)
    const paymentId = new mongoose.Types.ObjectId().toString()

    await Payment.create({
      _id: paymentId,
      invoiceNumber: 7777,
      type: 'debit',
      invoiceCreationDate: new Date('2024-01-01'),
      domain: ownDomainId,
    })
    const log = await createDeleteLog({ paymentId, domainId: ownDomainId })

    const res = await performRequest(log._id)
    expect(res.status).toHaveBeenCalledWith(409)
  })

  it('returns 403 when a DOMAIN_ADMIN restores a payment from a foreign domain', async () => {
    await mockLoginAs(users.domainAdmin)
    const paymentId = new mongoose.Types.ObjectId().toString()
    const log = await createDeleteLog({
      paymentId,
      domainId: foreignDomainId,
    })

    const res = await performRequest(log._id)
    expect(res.status).toHaveBeenCalledWith(403)

    const restored = await Payment.findById(paymentId)
    expect(restored).toBeNull()
  })

  it('allows a DOMAIN_ADMIN to restore a payment from their own domain', async () => {
    await mockLoginAs(users.domainAdmin)
    const paymentId = new mongoose.Types.ObjectId().toString()
    const log = await createDeleteLog({ paymentId, domainId: ownDomainId })

    const res = await performRequest(log._id)
    expect(res.status).toHaveBeenCalledWith(201)
    const restored = await Payment.findById(paymentId)
    expect(restored).not.toBeNull()
  })
})
