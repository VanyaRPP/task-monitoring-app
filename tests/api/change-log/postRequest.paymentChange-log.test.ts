import handler from '@pages/api/spacehub/payment/[id]/change-log'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import Payment from '@common/modules/models/Payment'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { expect } from '@jest/globals'
import mongoose from 'mongoose'

jest.mock('@utils/dbConnect', () => jest.fn())
jest.mock('@common/modules/models/PaymentChangeLog')
jest.mock('@common/modules/models/Payment')

setupTestEnvironment()

describe('PaymentChangeLog API - POST', () => {
  const validPaymentId = new mongoose.Types.ObjectId().toString()
  const invalidPaymentId = 'invalid-id-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create new change log with valid data', async () => {
    const mockInvoiceData = {
      amount: 1500,
      status: 'completed',
      description: 'Payment processed',
    }

    const mockCreatedLog = {
      _id: 'newLog1',
      paymentId: validPaymentId,
      invoiceData: mockInvoiceData,
      reason: 'manual',
      actorId: 'user123',
      actorEmail: 'admin@test.com',
      date: new Date(),
    }

    ;(Payment.exists as jest.Mock).mockResolvedValue(true)
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue(mockCreatedLog)

    const mockReq = {
      method: 'POST',
      query: { id: validPaymentId },
      body: {
        invoiceData: mockInvoiceData,
        reason: 'manual',
      },
      user: {
        _id: 'user123',
        email: 'admin@test.com',
      },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(Payment.exists).toHaveBeenCalledWith({ _id: validPaymentId })
    expect(PaymentChangeLog.create).toHaveBeenCalledWith({
      paymentId: validPaymentId,
      invoiceData: mockInvoiceData,
      actionType: 'UPDATE',
      source: 'single',
      reason: 'manual',
      actorId: 'user123',
      actorEmail: 'admin@test.com',
    })
    expect(mockRes.status).toHaveBeenCalledWith(201)
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: mockCreatedLog,
    })
  })

  it('should create log with default reason "manual" when reason is not provided', async () => {
    const mockInvoiceData = { amount: 2000 }

    ;(Payment.exists as jest.Mock).mockResolvedValue(true)
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

    const mockReq = {
      method: 'POST',
      query: { id: validPaymentId },
      body: {
        invoiceData: mockInvoiceData,
      },
      user: {
        _id: 'user456',
        email: 'user@test.com',
      },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(PaymentChangeLog.create).toHaveBeenCalledWith({
      paymentId: validPaymentId,
      invoiceData: mockInvoiceData,
      actionType: 'UPDATE',
      source: 'single',
      reason: 'manual',
      actorId: 'user456',
      actorEmail: 'user@test.com',
    })
    expect(mockRes.status).toHaveBeenCalledWith(201)
  })

  it('should return 400 when invoiceData is missing', async () => {
    const mockReq = {
      method: 'POST',
      query: { id: validPaymentId },
      body: {
        reason: 'manual',
      },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'invoiceData is required',
    })
    expect(PaymentChangeLog.create).not.toHaveBeenCalled()
  })

  it('should return 400 when body is null or undefined', async () => {
    const mockReq = {
      method: 'POST',
      query: { id: validPaymentId },
      body: null,
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'invoiceData is required',
    })
  })

  it('should return 404 when payment does not exist', async () => {
    const mockInvoiceData = { amount: 3000 }

    ;(Payment.exists as jest.Mock).mockResolvedValue(null)

    const mockReq = {
      method: 'POST',
      query: { id: validPaymentId },
      body: {
        invoiceData: mockInvoiceData,
        reason: 'automatic',
      },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(Payment.exists).toHaveBeenCalledWith({ _id: validPaymentId })
    expect(mockRes.status).toHaveBeenCalledWith(404)
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Payment not found',
    })
    expect(PaymentChangeLog.create).not.toHaveBeenCalled()
  })

  it('should return 400 for invalid paymentId in POST request', async () => {
    const mockReq = {
      method: 'POST',
      query: { id: invalidPaymentId },
      body: {
        invoiceData: { amount: 1000 },
      },
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
    expect(Payment.exists).not.toHaveBeenCalled()
  })

  it('should handle user data being undefined', async () => {
    const mockInvoiceData = { amount: 1000 }

    ;(Payment.exists as jest.Mock).mockResolvedValue(true)
    ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

    const mockReq = {
      method: 'POST',
      query: { id: validPaymentId },
      body: {
        invoiceData: mockInvoiceData,
      },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(PaymentChangeLog.create).toHaveBeenCalledWith({
      paymentId: validPaymentId,
      invoiceData: mockInvoiceData,
      actionType: 'UPDATE',
      source: 'single',
      reason: 'manual',
      actorId: undefined,
      actorEmail: undefined,
    })
    expect(mockRes.status).toHaveBeenCalledWith(201)
  })
})
