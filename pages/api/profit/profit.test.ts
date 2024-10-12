import { createMocks } from 'node-mocks-http'
import handler from './index'
import Domain from '@modules/models/Domain'
import Payment from '@modules/models/Payment'
import { getCurrentUser } from '@utils/getCurrentUser'
import dbConnect from '@utils/dbConnect'
import mongoClient from '@common/lib/mongodb'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

jest.mock('@utils/getCurrentUser')
jest.mock('@modules/models/Domain')
jest.mock('@modules/models/Payment')
jest.mock('@utils/dbConnect', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@common/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Мокаємо MongoDB адаптер для next-auth
jest.mock('@next-auth/mongodb-adapter', () => ({
  __esModule: true,
  MongoDBAdapter: jest.fn(() => ({
    db: jest.fn(() => ({
      collection: jest.fn(),
    })),
  })),
}))

describe('Profit Payment API - GET', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return grouped payments for a DomainAdmin and log data', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      isDomainAdmin: true,
      isGlobalAdmin: false,
      isAdmin: false,
      user: { email: 'admin@example.com' },
    })
    ;(Domain.find as jest.Mock).mockResolvedValue([{ _id: 'domain1' }])
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        invoiceCreationDate: new Date('2024-03-15'),
        generalSum: 787006.49,
        type: 'debit',
      },
      {
        invoiceCreationDate: new Date('2024-08-10'),
        generalSum: 76433,
        type: 'credit',
      },
      {
        invoiceCreationDate: new Date('2024-09-01'),
        generalSum: 207299.43,
        type: 'credit',
      },
      {
        invoiceCreationDate: new Date('2024-09-20'),
        generalSum: 2108832.48,
        type: 'debit',
      },
    ])

    const { req, res } = createMocks({
      method: 'GET',
      query: {},
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)

    const response = JSON.parse(res._getData())

    const currentDate = dayjs()
    response.data.forEach((entry: any) => {
      const entryDate = dayjs(entry.month, 'YYYY-MM')
      expect(entryDate.isSameOrAfter(currentDate.subtract(12, 'month'))).toBe(
        true
      )
      expect(entryDate.isSameOrBefore(currentDate)).toBe(true)
    })

    expect(response.success).toBe(true)
    expect(response.data).toEqual([
      {
        totalGeneralSumCredit: 0,
        totalGeneralSumDebit: 787006.49,
        month: '2024-03',
      },
      {
        totalGeneralSumCredit: 76433,
        totalGeneralSumDebit: 0,
        month: '2024-08',
      },
      {
        totalGeneralSumCredit: 207299.43,
        totalGeneralSumDebit: 2108832.48,
        month: '2024-09',
      },
    ])
  })

  it('should return 200 with "not allowed" message if user is not an admin', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      isDomainAdmin: false,
      isGlobalAdmin: false,
      isAdmin: false,
      user: { email: 'user@example.com' },
    })

    const { req, res } = createMocks({
      method: 'GET',
      query: {},
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const response = JSON.parse(res._getData())
    expect(response.message).toEqual('not allowed')
    expect(response.data).toEqual({})
  })

  it('should return all data for GlobalAdmin', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      isDomainAdmin: false,
      isGlobalAdmin: true,
      isAdmin: true,
      user: { email: 'globaladmin@example.com' },
    })
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        invoiceCreationDate: new Date('2024-01-10'),
        generalSum: 100000,
        type: 'debit',
      },
      {
        invoiceCreationDate: new Date('2024-04-15'),
        generalSum: 50000,
        type: 'credit',
      },
    ])

    const { req, res } = createMocks({
      method: 'GET',
      query: {},
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const response = JSON.parse(res._getData())

    expect(response.success).toBe(true)
    expect(response.data.length).toBeGreaterThan(0)
  })

  it('should return 400 if an error occurs', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      isDomainAdmin: true,
      isGlobalAdmin: false,
      isAdmin: false,
      user: { email: 'admin@example.com' },
    })
    ;(Payment.find as jest.Mock).mockRejectedValue(new Error('Database error'))

    const { req, res } = createMocks({
      method: 'GET',
      query: {},
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const response = JSON.parse(res._getData())
    expect(response.success).toBe(false)
    expect(response.message).toEqual('Database error')
  })
})
