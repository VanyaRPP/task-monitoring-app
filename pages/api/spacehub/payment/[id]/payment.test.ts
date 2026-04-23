import { expect } from '@jest/globals'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { payments, users } from '@utils/testData'
import handler from '.'
import Payment from '@common/modules/models/Payment'
import Domain from '@modules/models/Domain'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'
import ProfitService from '@common/services/profitService/profit.service'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

jest.mock('@common/modules/models/Payment')
jest.mock('@common/modules/models/PaymentChangeLog')
jest.mock('@modules/models/Domain')
jest.mock('@common/services/profitService/profit.service')

setupTestEnvironment()

describe('Payment API Endpoint - [id]', () => {
  const performRequest = async (method: 'PATCH' | 'DELETE' | 'GET', id: any, body?: any) => {
    const mockReq = {
      method,
      query: { id: id.toString() },
      body: body || {},
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    } as any

    try {
      await handler(mockReq, mockRes)
    } catch (e) {
      process.stderr.write(`\n!!! HANDLER CRASHED: ${e.message}\n`)
    }
    return mockRes
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET - Permission Checks', () => {
    it('should allow GlobalAdmin to get any payment', async () => {
      await mockLoginAs(users.globalAdmin)
      ;(Payment.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        ...payments[0],
      })

      const res = await performRequest('GET', payments[0]._id)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      )
    })

    it('should return 400 if payment not found or error occurs', async () => {
      await mockLoginAs(users.globalAdmin)
      ;(Payment.findById as jest.Mock).mockImplementation(() => {
        throw new Error('DB Error')
      })

      const res = await performRequest('GET', 'invalid-id')
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('PATCH - Permission Checks', () => {
    it('should allow GlobalAdmin to update payment', async () => {
      await mockLoginAs(users.globalAdmin)
      const updateData = { description: 'Updated' }
      
      ;(Payment.findById as jest.Mock).mockResolvedValue(payments[0])
      ;(Payment.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...payments[0],
        ...updateData,
      })
      ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})
      ;(ProfitService.updatePayment as jest.Mock).mockResolvedValue({})

      const res = await performRequest('PATCH', payments[0]._id, updateData)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalled()
      
      const jsonResponse = res.json.mock.calls[0][0]
      expect(jsonResponse.success).toBe(true)
      expect(jsonResponse.data.description).toBe('Updated')
      
      expect(PaymentChangeLog.create).toHaveBeenCalled()
      expect(ProfitService.updatePayment).toHaveBeenCalled()
    })

    it('should return 400 for regular User', async () => {
      await mockLoginAs(users.user)
      const res = await performRequest('PATCH', payments[0]._id, { description: 'hack' })
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('DELETE - Permission Checks', () => {
    it('should allow GlobalAdmin to delete', async () => {
      await mockLoginAs(users.globalAdmin)
      ;(Payment.findByIdAndRemove as jest.Mock).mockResolvedValue(payments[0])
      ;(ProfitService.deleteByIdPayment as jest.Mock).mockResolvedValue({})

      const res = await performRequest('DELETE', payments[0]._id)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(ProfitService.deleteByIdPayment).toHaveBeenCalledWith(payments[0]._id.toString())
      if (res.json.mock.calls.length > 0) {
        expect(res.json.mock.calls[0][0].data._id.toString()).toBe(payments[0]._id.toString())
      }
    })

    it('should return 400 for NoRole user', async () => {
      await mockLoginAs(users.noRoleUser)
      const res = await performRequest('DELETE', payments[0]._id)
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})