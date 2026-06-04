import { expect } from '@jest/globals'
import { getServerSession } from 'next-auth'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { users } from '@utils/testData'
import handler from '.'
import Payment from '@common/modules/models/Payment'
import Domain from '@modules/models/Domain'
import ProfitService from '@common/services/profitService/profit.service'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@utils/email/sendInvoiceEmail', () => ({ sendInvoiceEmail: jest.fn() }))

jest.mock('@common/modules/models/Payment')
jest.mock('@modules/models/Domain')
jest.mock('@common/services/profitService/profit.service')

setupTestEnvironment()

describe('Payment API Endpoint - duplicate', () => {
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

  // Sources must expose `toObject()` because the service clones through it.
  const makeSource = (id: string, domain: string) => ({
    _id: { toString: () => id },
    domain: { toString: () => domain },
    toObject: () => ({
      _id: id,
      type: 'debit',
      domain,
      generalSum: 100,
      description: 'original',
      invoiceNumber: 1,
      invoiceCreationDate: new Date('2020-01-01T00:00:00.000Z'),
    }),
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockReset()
    ;(ProfitService.create as jest.Mock).mockResolvedValue({})
    ;(Payment.aggregate as jest.Mock).mockResolvedValue([{ maxNumber: 500 }])
    ;(Payment.create as jest.Mock).mockImplementation((data: any) =>
      Promise.resolve({
        ...data,
        _id: `dup-${data.invoiceNumber}`,
        id: `dup-${data.invoiceNumber}`,
      })
    )
  })

  it('rejects non-POST methods with 405', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest('GET')
    expect(res.status).toHaveBeenCalledWith(405)
  })

  it('returns 403 for regular User', async () => {
    await mockLoginAs(users.user)
    const res = await performRequest('POST', { ids: ['p1'] })
    expect(res.status).toHaveBeenCalledWith(403)
    expect(Payment.find).not.toHaveBeenCalled()
  })

  it('returns 400 when ids is an empty array', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest('POST', { ids: [] })
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when ids is missing', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest('POST', {})
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('global admin: duplicates the requested payments', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([
      makeSource('p1', 'domain-1'),
      makeSource('p2', 'domain-1'),
    ])

    const res = await performRequest('POST', { ids: ['p1', 'p2'] })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.success).toBe(true)
    expect(json.data.createdIds).toHaveLength(2)
    expect(json.data.skippedIds).toHaveLength(0)
    expect(json.data.totalRequested).toBe(2)
    expect(Payment.create).toHaveBeenCalledTimes(2)
  })

  it('domain admin: skips payments outside their administered domains', async () => {
    await mockLoginAs(users.domainAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([
      makeSource('own', 'domain-allowed'),
      makeSource('foreign', 'domain-other'),
    ])
    ;(Domain.find as jest.Mock).mockResolvedValue([
      { _id: { toString: () => 'domain-allowed' } },
    ])

    const res = await performRequest('POST', { ids: ['own', 'foreign'] })

    expect(res.status).toHaveBeenCalledWith(200)
    const json = (res.json as jest.Mock).mock.calls[0][0]
    expect(json.data.createdIds).toHaveLength(1)
    expect(json.data.skippedIds).toContain('foreign')
    expect(Payment.create).toHaveBeenCalledTimes(1)
  })
})
