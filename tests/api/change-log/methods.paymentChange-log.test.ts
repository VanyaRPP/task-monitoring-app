import handler from '@pages/api/spacehub/payment/[id]/change-log'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { expect } from '@jest/globals'
import mongoose from 'mongoose'

jest.mock('@utils/dbConnect', () => jest.fn())

setupTestEnvironment()

describe('PaymentChangeLog API - Unsupported Methods', () => {
  const validPaymentId = new mongoose.Types.ObjectId().toHexString()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const unsupportedMethods = ['PUT', 'PATCH']

  unsupportedMethods.forEach((method) => {
    it(`should return 405 for ${method} request`, async () => {
      const mockReq = {
        method,
        query: { id: validPaymentId },
      } as any

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as any

      await handler(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(405)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Method not allowed',
      })
    })
  })

  it('should return 400 for DELETE request without changeLogId', async () => {
    const mockReq = {
      method: 'DELETE',
      query: { id: validPaymentId }, 
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid ids',
    })
  })
})