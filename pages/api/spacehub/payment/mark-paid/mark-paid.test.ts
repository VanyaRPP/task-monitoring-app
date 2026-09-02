import { expect } from '@jest/globals'
import { getServerSession } from 'next-auth'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { payments, users, domains } from '@utils/testData'
import handler from '.'
import Payment from '@common/modules/models/Payment'
import Domain from '@modules/models/Domain'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import { Operations } from '@utils/constants'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

jest.mock('@common/modules/models/Payment')
jest.mock('@common/modules/models/PaymentChangeLog')
jest.mock('@modules/models/Domain')

setupTestEnvironment()

describe('Payment API Endpoint - mark-paid', () => {
  const performRequest = async (method: 'POST' | 'GET', body?: any) => {
    const mockReq = { method, query: {}, body: body ?? {} } as any
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    } as any

    await handler(mockReq, mockRes)
    return mockRes
  }

  const debitPayments = payments.filter((p) => p.type === 'debit') as any[]
  const creditPayment = payments.find((p) => p.type === 'credit') as any

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockReset()
    // Domain is mocked here; reflect real domain admins so getCurrentUser's
    // role derivation doesn't demote seeded DomainAdmins (and doesn't promote
    // regular users).
    ;(Domain.exists as jest.Mock).mockImplementation((q) =>
      Promise.resolve(
        [users.domainAdmin.email, users.domainAdmin2.email].includes(
          q?.adminEmails
        )
          ? { _id: 'exists' }
          : null
      )
    )
  })

  it('rejects non-POST methods with 405', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest('GET')
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 403 for regular User', async () => {
    await mockLoginAs(users.user)
    const res = await performRequest('POST', { ids: [debitPayments[0]._id] })
    expect(res.status).toHaveBeenCalledWith(403)
    expect(Payment.find).not.toHaveBeenCalled()
  })

  it('returns 400 if ids is missing or empty', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest('POST', { ids: [] })
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('global admin: creates a new credit payment for each debit, original stays untouched', async () => {
    await mockLoginAs(users.globalAdmin)
    const ids = [debitPayments[0]._id, debitPayments[1]._id]

    ;(Payment.find as jest.Mock).mockResolvedValue([
      debitPayments[0],
      debitPayments[1],
    ])
    let nextMax = 100
    ;(Payment.aggregate as jest.Mock).mockImplementation(() =>
      Promise.resolve([{ maxNumber: nextMax++ }])
    )
    ;(Payment.create as jest.Mock).mockImplementation((data: any) =>
      Promise.resolve({ ...data, _id: `credit-${data.invoiceNumber}` })
    )
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

    const res = await performRequest('POST', { ids })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.success).toBe(true)
    expect(json.data.createdIds).toHaveLength(2)
    expect(json.data.skippedIds).toHaveLength(0)
    expect(json.data.totalRequested).toBe(2)

    // Original debit payments NOT mutated
    expect(Payment.findOneAndUpdate).not.toHaveBeenCalled()

    // New credit payments are created via Payment.create
    expect(Payment.create).toHaveBeenCalledTimes(2)
    const firstCreateArg = (Payment.create as jest.Mock).mock.calls[0][0]
    const secondCreateArg = (Payment.create as jest.Mock).mock.calls[1][0]
    expect(firstCreateArg.type).toBe(Operations.Credit)
    expect(firstCreateArg.generalSum).toBe(debitPayments[0].generalSum)
    // each credit payment gets a fresh invoiceNumber from getMaxInvoiceNumber + 1
    expect(firstCreateArg.invoiceNumber).toBe(101)
    expect(secondCreateArg.invoiceNumber).toBe(102)
    expect(firstCreateArg.invoiceNumber).not.toBe(
      debitPayments[0].invoiceNumber
    )
    // date shifted by 1ms
    expect(firstCreateArg.invoiceCreationDate.getTime()).toBe(
      new Date(debitPayments[0].invoiceCreationDate).getTime() + 1
    )

    // paidAt records when the money actually arrived, independent of the
    // invoice date the credit is filed under.
    expect(firstCreateArg.paidAt).toBeInstanceOf(Date)
    expect(secondCreateArg.paidAt).toBeInstanceOf(Date)

    expect(PaymentChangeLog.create).toHaveBeenCalledTimes(2)
  })

  it('creates the credit payment with an empty invoice array, not the source services', async () => {
    await mockLoginAs(users.globalAdmin)
    const sourceWithServices = {
      ...debitPayments[0],
      invoice: [{ service: 'test-service', sum: 100 }],
    }
    ;(Payment.find as jest.Mock).mockResolvedValue([sourceWithServices])
    ;(Payment.create as jest.Mock).mockImplementation((data: any) =>
      Promise.resolve({ ...data, _id: 'credit-id' })
    )
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

    await performRequest('POST', { ids: [sourceWithServices._id] })

    const createArg = (Payment.create as jest.Mock).mock.calls[0][0]
    expect(createArg.invoice).toEqual([])
  })

  it('creates the credit payment with an empty invoice array, not the source services', async () => {
    await mockLoginAs(users.globalAdmin)
    const sourceWithServices = {
      ...debitPayments[0],
      invoice: [{ service: 'test-service', sum: 100 }],
    }
    ;(Payment.find as jest.Mock).mockResolvedValue([sourceWithServices])
    ;(Payment.create as jest.Mock).mockImplementation((data: any) =>
      Promise.resolve({ ...data, _id: 'credit-id' })
    )
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

    await performRequest('POST', { ids: [sourceWithServices._id] })

    const createArg = (Payment.create as jest.Mock).mock.calls[0][0]
    expect(createArg.invoice).toEqual([])
  })

  it('skips already-paid (credit) payments — only debit can be marked', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([creditPayment])

    const res = await performRequest('POST', { ids: [creditPayment._id] })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.createdIds).toHaveLength(0)
    expect(json.data.skippedIds).toContain(creditPayment._id.toString())
    expect(Payment.create).not.toHaveBeenCalled()
    expect(PaymentChangeLog.create).not.toHaveBeenCalled()
  })

  it('domain admin: only creates credits for payments belonging to one of their domains', async () => {
    await mockLoginAs(users.domainAdmin)
    const ownDomainPayment = debitPayments.find(
      (p) => p.domain === domains[0]._id
    )
    const foreignDomainPayment = debitPayments.find(
      (p) => p.domain !== domains[0]._id
    )

    ;(Payment.find as jest.Mock).mockResolvedValue([
      ownDomainPayment,
      foreignDomainPayment,
    ])
    ;(Domain.find as jest.Mock).mockResolvedValue([
      { _id: domains[0]._id, adminEmails: [users.domainAdmin.email] },
    ])
    ;(Payment.create as jest.Mock).mockImplementation((data: any) =>
      Promise.resolve({ ...data, _id: `credit-${data.invoiceNumber}` })
    )
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

    const res = await performRequest('POST', {
      ids: [ownDomainPayment._id, foreignDomainPayment._id],
    })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.createdIds).toHaveLength(1)
    expect(json.data.skippedIds).toContain(foreignDomainPayment._id.toString())
    expect(Payment.create).toHaveBeenCalledTimes(1)
  })

  it('domain admin: handles multi-domain admin correctly', async () => {
    await mockLoginAs(users.domainAdmin)
    const p1 = debitPayments.find((p) => p.domain === domains[0]._id)
    const p2 = {
      ...debitPayments[0],
      _id: 'other-payment-id',
      domain: domains[5]._id,
    }

    ;(Payment.find as jest.Mock).mockResolvedValue([p1, p2])
    ;(Domain.find as jest.Mock).mockResolvedValue([
      { _id: domains[0]._id, adminEmails: [users.domainAdmin.email] },
      { _id: domains[5]._id, adminEmails: [users.domainAdmin.email] },
    ])
    ;(Payment.create as jest.Mock).mockImplementation((data: any) =>
      Promise.resolve({ ...data, _id: `credit-${Math.random()}` })
    )
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

    const res = await performRequest('POST', { ids: [p1._id, p2._id] })

    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.createdIds).toHaveLength(2)
    expect(json.data.skippedIds).toHaveLength(0)
  })

  it('reports not-found ids as skipped', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([debitPayments[0]])
    ;(Payment.create as jest.Mock).mockImplementation((data: any) =>
      Promise.resolve({ ...data, _id: 'credit-id' })
    )
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

    const res = await performRequest('POST', {
      ids: [debitPayments[0]._id, 'nonexistent-id'],
    })

    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.createdIds).toHaveLength(1)
    expect(json.data.skippedIds).toContain('nonexistent-id')
  })

  it('logs original payment id (not the new credit) as paymentId in change log', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([debitPayments[0]])
    ;(Payment.create as jest.Mock).mockResolvedValue({
      _id: 'new-credit-id',
      invoiceNumber: debitPayments[0].invoiceNumber,
      generalSum: debitPayments[0].generalSum,
      invoiceCreationDate: new Date(),
      description: '',
    })
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

    await performRequest('POST', { ids: [debitPayments[0]._id] })

    const logArg = (PaymentChangeLog.create as jest.Mock).mock.calls[0][0]
    expect(logArg.paymentId).toBe(debitPayments[0]._id)
    expect(logArg.actionType).toBe('MARK_PAID')
    expect(logArg.source).toBe('quick-pay')
    expect(logArg.reason).toBe('mark-paid')
    expect(logArg.before._id).toBe(debitPayments[0]._id)
    expect(logArg.after._id).toBe('new-credit-id')
  })
})
