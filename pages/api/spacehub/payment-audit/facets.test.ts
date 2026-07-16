import { expect } from '@jest/globals'
import { getServerSession } from 'next-auth'
import mongoose from 'mongoose'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, realEstates, users } from '@utils/testData'
import handler from './facets'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

const dOwn = domains[0]._id
const dOther = domains[6]._id 
const dOrphan = domains[1]._id 

const invoiceData = {
  invoiceNumber: 1,
  invoiceCreationDate: new Date('2024-01-01'),
  invoice: [],
  provider: { description: 'p' },
  reciever: { companyName: 'c', adminEmails: [], description: 'd' },
  generalSum: 100,
  type: 'debit',
}

const makeLog = (domainId: string, companyId: string) => ({
  paymentId: new mongoose.Types.ObjectId(),
  date: new Date('2024-01-01'),
  actionType: 'CREATE',
  source: 'single',
  domainId: new mongoose.Types.ObjectId(domainId),
  companyId: new mongoose.Types.ObjectId(companyId),
  invoiceData: { ...invoiceData },
})

const performRequest = async () => {
  const mockReq = { method: 'GET', query: {} } as any
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as any
  await handler(mockReq, mockRes)
  return mockRes
}

const jsonOf = (res: any) => (res.json as jest.Mock).mock.calls[0][0]

describe('Payment Audit API - facets', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockReset()
    await (PaymentChangeLog as any).insertMany([
      makeLog(dOwn, realEstates[0]._id),
      makeLog(dOther, realEstates[1]._id),
      makeLog(dOrphan, realEstates[2]._id),
    ])
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

  it('returns 403 for a regular user', async () => {
    await mockLoginAs(users.user)
    const res = await performRequest()
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('GLOBAL_ADMIN gets every domain and company present in the logs', async () => {
    await mockLoginAs(users.globalAdmin)
    const res = await performRequest()

    const body = jsonOf(res)
    expect(body.domains).toHaveLength(3)
    expect(body.companies).toHaveLength(3)
    expect(body.domains.map((d: any) => d._id).sort()).toEqual(
      [dOwn, dOther, dOrphan].sort()
    )
    // names are resolved
    expect(body.companies.every((c: any) => !!c.name)).toBe(true)
  })

  it('DOMAIN_ADMIN only gets facets within their own domains', async () => {
    await mockLoginAs(users.domainAdmin)
    const res = await performRequest()

    const body = jsonOf(res)
    expect(body.domains).toHaveLength(1)
    expect(body.domains[0]._id).toBe(dOwn)
    expect(body.companies).toHaveLength(1)
    expect(body.companies[0]._id).toBe(realEstates[0]._id)
  })
})
