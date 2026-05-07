import { expect } from '@jest/globals'
import { getServerSession } from 'next-auth'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { payments, users, domains } from '@utils/testData'
import handler from '.'
import Payment from '@common/modules/models/Payment'
import Domain from '@modules/models/Domain'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import ProfitService from '@common/services/profitService/profit.service'
import { Operations } from '@utils/constants'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

jest.mock('@common/modules/models/Payment')
jest.mock('@common/modules/models/PaymentChangeLog')
jest.mock('@modules/models/Domain')
jest.mock('@common/services/profitService/profit.service')

setupTestEnvironment()

describe('Payment API Endpoint - bulk mark-paid', () => {
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

  it('global admin marks all selected debit payments as credit', async () => {
    await mockLoginAs(users.globalAdmin)
    const ids = [debitPayments[0]._id, debitPayments[1]._id]

    ;(Payment.find as jest.Mock).mockResolvedValue([
      debitPayments[0],
      debitPayments[1],
    ])
    ;(Payment.findOneAndUpdate as jest.Mock).mockImplementation(
      ({ _id }: any) => {
        const found = debitPayments.find((p) => p._id === _id)
        return Promise.resolve({ ...found, type: Operations.Credit })
      }
    )
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})
    ;(ProfitService.updatePayment as jest.Mock).mockResolvedValue({})

    const res = await performRequest('POST', { ids })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.success).toBe(true)
    expect(json.data.updatedIds).toHaveLength(2)
    expect(json.data.skippedIds).toHaveLength(0)
    expect(json.data.totalRequested).toBe(2)
    expect(PaymentChangeLog.create).toHaveBeenCalledTimes(2)
    expect(ProfitService.updatePayment).toHaveBeenCalledTimes(2)
  })

  it('skips already-paid (credit) payments without re-updating', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([creditPayment])

    const res = await performRequest('POST', { ids: [creditPayment._id] })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.updatedIds).toHaveLength(0)
    expect(json.data.skippedIds).toContain(creditPayment._id.toString())
    expect(Payment.findOneAndUpdate).not.toHaveBeenCalled()
    expect(PaymentChangeLog.create).not.toHaveBeenCalled()
  })

  it('domain admin: only updates payments belonging to one of their domains', async () => {
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
    ;(Payment.findOneAndUpdate as jest.Mock).mockImplementation(
      ({ _id }: any) => {
        const found = [ownDomainPayment, foreignDomainPayment].find(
          (p) => p._id === _id
        )
        return Promise.resolve({ ...found, type: Operations.Credit })
      }
    )
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

    const res = await performRequest('POST', {
      ids: [ownDomainPayment._id, foreignDomainPayment._id],
    })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.updatedIds).toEqual([ownDomainPayment._id.toString()])
    expect(json.data.skippedIds).toContain(foreignDomainPayment._id.toString())
    expect(Payment.findOneAndUpdate).toHaveBeenCalledTimes(1)
    expect(ProfitService.updatePayment).not.toHaveBeenCalled()
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
    ;(Payment.findOneAndUpdate as jest.Mock).mockImplementation(
      ({ _id }: any) => {
        const found = [p1, p2].find((p) => p._id === _id)
        return Promise.resolve({ ...found, type: Operations.Credit })
      }
    )
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

    const res = await performRequest('POST', { ids: [p1._id, p2._id] })

    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.updatedIds).toHaveLength(2)
    expect(json.data.skippedIds).toHaveLength(0)
  })

  it('reports not-found ids as skipped', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([debitPayments[0]])
    ;(Payment.findOneAndUpdate as jest.Mock).mockResolvedValue({
      ...debitPayments[0],
      type: Operations.Credit,
    })
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})
    ;(ProfitService.updatePayment as jest.Mock).mockResolvedValue({})

    const res = await performRequest('POST', {
      ids: [debitPayments[0]._id, 'nonexistent-id'],
    })

    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.updatedIds).toEqual([debitPayments[0]._id.toString()])
    expect(json.data.skippedIds).toContain('nonexistent-id')
  })
})
