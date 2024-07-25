import handler from '@pages/api/spacehub/payment/[id]/change-log'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { expect } from '@jest/globals'
import mongoose from 'mongoose'

jest.mock('@utils/dbConnect', () => jest.fn())
jest.mock('@common/modules/models/PaymentChangeLog')
jest.mock('@common/modules/models/Payment')

setupTestEnvironment()

describe('PaymentChangeLog API - Unsupported Methods', () => {
  const validPaymentId = new mongoose.Types.ObjectId().toString()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 405 for PUT request', async () => {
    const mockReq = {
      method: 'PUT',
      query: { id: validPaymentId },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(405)
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Method not allowed',
    })
  })

  it('should return 405 for DELETE request', async () => {
    const mockReq = {
      method: 'DELETE',
      query: { id: validPaymentId },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(405)
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Method not allowed',
    })
  })

  it('should return 405 for PATCH request', async () => {
    const mockReq = {
      method: 'PATCH',
      query: { id: validPaymentId },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(405)
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Method not allowed',
    })
  })
})