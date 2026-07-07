import { expect } from '@jest/globals'
import { getServerSession } from 'next-auth'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { payments, users, domains } from '@utils/testData'
import handler from '.'
import Payment from '@common/modules/models/Payment'
import Domain from '@modules/models/Domain'
import ProfitService from '@common/services/profitService/profit.service'
import { logPaymentMutation } from '@common/modules/services/paymentAudit'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

jest.mock('@common/modules/models/Payment')
jest.mock('@modules/models/Domain')
jest.mock('@common/services/profitService/profit.service')
jest.mock('@common/modules/services/paymentAudit', () => ({
  logPaymentMutation: jest.fn(),
}))

setupTestEnvironment()

describe('Payment API Endpoint - bulk delete', () => {
  const performRequest = async (
    method: 'DELETE' | 'GET' | 'POST',
    body?: any
  ) => {
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

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockReset()
    ;(Payment.deleteMany as jest.Mock).mockReset()
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

  it('rejects non-DELETE methods with 405', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest('GET')
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 403 for regular User', async () => {
    await mockLoginAs(users.user)
    const res = await performRequest('DELETE', { ids: [debitPayments[0]._id] })
    expect(res.status).toHaveBeenCalledWith(403)
    expect(Payment.find).not.toHaveBeenCalled()
    expect(Payment.deleteMany).not.toHaveBeenCalled()
  })

  it('returns 400 if ids is missing or empty', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest('DELETE', { ids: [] })
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('global admin: deletes all requested payments and clears their Profit entries', async () => {
    await mockLoginAs(users.globalAdmin)
    const ids = [debitPayments[0]._id, debitPayments[1]._id]

    ;(Payment.find as jest.Mock).mockResolvedValue([
      debitPayments[0],
      debitPayments[1],
    ])
    ;(Payment.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 })
    ;(ProfitService.deleteByIdPayment as jest.Mock).mockResolvedValue({})

    const res = await performRequest('DELETE', { ids })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.success).toBe(true)
    expect(json.data.deletedIds).toEqual([
      debitPayments[0]._id.toString(),
      debitPayments[1]._id.toString(),
    ])
    expect(Payment.deleteMany).toHaveBeenCalledWith({
      _id: {
        $in: [debitPayments[0]._id.toString(), debitPayments[1]._id.toString()],
      },
    })
    expect(ProfitService.deleteByIdPayment).toHaveBeenCalledTimes(2)

    // One BULK_DELETE audit entry per deleted payment, sharing a single batchId.
    const auditCalls = (logPaymentMutation as jest.Mock).mock.calls
    expect(auditCalls).toHaveLength(2)
    expect(auditCalls[0][0]).toMatchObject({
      actionType: 'BULK_DELETE',
      source: 'bulk',
    })
    expect(auditCalls[0][0].batchId).toBeDefined()
    expect(auditCalls[0][0].batchId).toEqual(auditCalls[1][0].batchId)
  })

  it('domain admin: deletes only payments belonging to one of their domains', async () => {
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
    ;(Payment.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 1 })

    const res = await performRequest('DELETE', {
      ids: [ownDomainPayment._id, foreignDomainPayment._id],
    })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.deletedIds).toEqual([ownDomainPayment._id.toString()])
    expect(Payment.deleteMany).toHaveBeenCalledWith({
      _id: { $in: [ownDomainPayment._id.toString()] },
    })
    // ProfitService should NOT run for domain admin
    expect(ProfitService.deleteByIdPayment).not.toHaveBeenCalled()
  })

  it('domain admin: handles multi-domain admin (deletes payments across all owned domains)', async () => {
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
    ;(Payment.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 })

    const res = await performRequest('DELETE', { ids: [p1._id, p2._id] })

    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.deletedIds).toHaveLength(2)
  })

  it('domain admin: rejects everything when no payments fall in their domains', async () => {
    await mockLoginAs(users.domainAdmin)
    const foreignPayment = debitPayments.find(
      (p) => p.domain !== domains[0]._id
    )

    ;(Payment.find as jest.Mock).mockResolvedValue([foreignPayment])
    ;(Domain.find as jest.Mock).mockResolvedValue([
      { _id: domains[0]._id, adminEmails: [users.domainAdmin.email] },
    ])

    const res = await performRequest('DELETE', { ids: [foreignPayment._id] })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.deletedIds).toEqual([])
    expect(Payment.deleteMany).not.toHaveBeenCalled()
    expect(logPaymentMutation).not.toHaveBeenCalled()
  })

  it('returns empty deletedIds when all requested ids are not found', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([])

    const res = await performRequest('DELETE', { ids: ['ghost-1', 'ghost-2'] })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.deletedIds).toEqual([])
    expect(Payment.deleteMany).not.toHaveBeenCalled()
  })

  it('returns 401 when no user matches the session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValueOnce({
      user: { email: 'ghost-not-in-db@example.com' },
    })
    const res = await performRequest('DELETE', {
      ids: [debitPayments[0]._id],
    })
    expect(res.status).toHaveBeenCalledWith(401)
    expect(Payment.find).not.toHaveBeenCalled()
  })

  it('returns 400 when ids contains non-string values', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest('DELETE', {
      ids: [debitPayments[0]._id, 42, null],
    })
    expect(res.status).toHaveBeenCalledWith(400)
    expect(Payment.find).not.toHaveBeenCalled()
  })

  it('returns 400 when body is null', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest('DELETE', null)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when ids contains empty string', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest('DELETE', { ids: ['', 'foo'] })
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('domain admin with no admin domains gets empty deletedIds', async () => {
    await mockLoginAs(users.domainAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([debitPayments[0]])
    ;(Domain.find as jest.Mock).mockResolvedValue([])

    const res = await performRequest('DELETE', {
      ids: [debitPayments[0]._id],
    })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.deletedIds).toEqual([])
    expect(Payment.deleteMany).not.toHaveBeenCalled()
  })

  it('returns empty deletedIds when deleteMany reports deletedCount=0 (concurrent delete)', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([debitPayments[0]])
    ;(Payment.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 0 })

    const res = await performRequest('DELETE', {
      ids: [debitPayments[0]._id],
    })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.deletedIds).toEqual([])
    expect(ProfitService.deleteByIdPayment).not.toHaveBeenCalled()
  })

  it('re-queries to find actually-deleted ids when deletedCount is partial', async () => {
    await mockLoginAs(users.globalAdmin)
    const a = debitPayments[0]
    const b = debitPayments[1]

    ;(Payment.find as jest.Mock)
      // first call: load source payments
      .mockResolvedValueOnce([a, b])
      // second call: re-query, returns the one that survived
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue([{ _id: b._id }]),
      })
    ;(Payment.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 1 })
    ;(ProfitService.deleteByIdPayment as jest.Mock).mockResolvedValue({})

    const res = await performRequest('DELETE', { ids: [a._id, b._id] })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.deletedIds).toEqual([a._id.toString()])
    expect(ProfitService.deleteByIdPayment).toHaveBeenCalledTimes(1)
    expect(ProfitService.deleteByIdPayment).toHaveBeenCalledWith(
      a._id.toString()
    )
  })

  it('skips payments with null domain when caller is domain admin', async () => {
    await mockLoginAs(users.domainAdmin)
    const orphanPayment = { ...debitPayments[0], domain: null }

    ;(Payment.find as jest.Mock).mockResolvedValue([orphanPayment])
    ;(Domain.find as jest.Mock).mockResolvedValue([
      { _id: domains[0]._id, adminEmails: [users.domainAdmin.email] },
    ])

    const res = await performRequest('DELETE', { ids: [orphanPayment._id] })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.deletedIds).toEqual([])
    expect(Payment.deleteMany).not.toHaveBeenCalled()
  })

  it('still returns success when ProfitService cleanup partially fails (errors are swallowed and logged)', async () => {
    await mockLoginAs(users.globalAdmin)
    const a = debitPayments[0]
    const b = debitPayments[1]

    ;(Payment.find as jest.Mock).mockResolvedValue([a, b])
    ;(Payment.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 })
    ;(ProfitService.deleteByIdPayment as jest.Mock)
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('profit cleanup failed'))

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const res = await performRequest('DELETE', { ids: [a._id, b._id] })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.deletedIds).toHaveLength(2)
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})
