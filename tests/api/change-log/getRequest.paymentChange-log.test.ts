import handler from '@pages/api/spacehub/payment/[id]/change-log'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { expect } from '@jest/globals'
import mongoose from 'mongoose'

jest.mock('@utils/dbConnect', () => jest.fn())
jest.mock('@common/modules/models/PaymentChangeLog')
jest.mock('@common/modules/models/Payment')

setupTestEnvironment()

describe('PaymentChangeLog API - GET', () => {
  const validPaymentId = new mongoose.Types.ObjectId().toString()
  const invalidPaymentId = 'invalid-id-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return payment change logs for valid paymentId', async () => {
    const mockLogs = [
      {
        _id: 'log1',
        paymentId: validPaymentId,
        invoiceData: { amount: 1000, status: 'paid' },
        reason: 'manual',
        actorEmail: 'admin@test.com',
        date: new Date('2024-01-15'),
      },
      {
        _id: 'log2',
        paymentId: validPaymentId,
        invoiceData: { amount: 500, status: 'pending' },
        reason: 'automatic',
        actorEmail: 'system@test.com',
        date: new Date('2024-01-10'),
      },
    ]

    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockLogs),
      }),
    })

    ;(PaymentChangeLog.find as jest.Mock) = mockFind

    const mockReq = {
      method: 'GET',
      query: { id: validPaymentId },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockFind).toHaveBeenCalledWith({ paymentId: validPaymentId })
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: mockLogs,
    })
  })

  it('should return empty array when no logs found for paymentId', async () => {
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    })

    ;(PaymentChangeLog.find as jest.Mock) = mockFind

    const mockReq = {
      method: 'GET',
      query: { id: validPaymentId },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: [],
    })
  })

  it('should return 400 for invalid paymentId format', async () => {
    const mockReq = {
      method: 'GET',
      query: { id: invalidPaymentId },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid payment id',
    })
  })

  it('should sort logs by date in descending order (newest first)', async () => {
    const sortMock = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    })

    const mockFind = jest.fn().mockReturnValue({
      sort: sortMock,
    })

    ;(PaymentChangeLog.find as jest.Mock) = mockFind

    const mockReq = {
      method: 'GET',
      query: { id: validPaymentId },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(sortMock).toHaveBeenCalledWith({ date: -1 })
  })
})
