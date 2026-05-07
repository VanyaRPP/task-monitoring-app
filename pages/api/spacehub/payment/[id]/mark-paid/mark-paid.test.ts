import { expect } from '@jest/globals'
import { getServerSession } from 'next-auth'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { payments, users } from '@utils/testData'
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

describe('Payment API Endpoint - mark-paid', () => {
  const performRequest = async (
    method: 'POST' | 'GET' | 'PATCH',
    id: any,
    body?: any
  ) => {
    const mockReq = {
      method,
      query: { id: id?.toString() },
      body: body || {},
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    } as any

    await handler(mockReq, mockRes)
    return mockRes
  }

  const debitPayment = payments.find((p) => p.type === 'debit') as any
  const creditPayment = payments.find((p) => p.type === 'credit') as any

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockReset()
  })

  describe('Method handling', () => {
    it('rejects non-POST methods with 405', async () => {
      await mockLoginAs(users.globalAdmin)
      const res = await performRequest('GET', debitPayment._id)
      expect(res.status).toHaveBeenCalledWith(405)
    })
  })

  describe('Permission checks', () => {
    it('forbids regular User with 403', async () => {
      await mockLoginAs(users.user)
      const res = await performRequest('POST', debitPayment._id)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(Payment.findOneAndUpdate).not.toHaveBeenCalled()
      expect(PaymentChangeLog.create).not.toHaveBeenCalled()
    })

    it('forbids domain admin if payment domain is not in their adminEmails', async () => {
      await mockLoginAs(users.domainAdmin2)
      ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
      ;(Domain.findOne as jest.Mock).mockResolvedValue(null)

      const res = await performRequest('POST', debitPayment._id)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(Domain.findOne).toHaveBeenCalledWith({
        _id: debitPayment.domain,
        adminEmails: { $in: [users.domainAdmin2.email] },
      })
      expect(Payment.findOneAndUpdate).not.toHaveBeenCalled()
      expect(PaymentChangeLog.create).not.toHaveBeenCalled()
    })

    it('allows domain admin if the payment domain is one of theirs (multi-domain admin)', async () => {
      await mockLoginAs(users.domainAdmin)
      ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
      ;(Domain.findOne as jest.Mock).mockResolvedValue({
        _id: debitPayment.domain,
        adminEmails: [users.domainAdmin.email],
      })
      ;(Payment.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...debitPayment,
        type: Operations.Credit,
      })
      ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

      const res = await performRequest('POST', debitPayment._id)

      expect(res.status).toHaveBeenCalledWith(200)
      const json = (res.json as jest.Mock).mock.calls[0][0]
      expect(json.success).toBe(true)
      expect(json.data.type).toBe(Operations.Credit)
      expect(Payment.findOneAndUpdate).toHaveBeenCalled()
    })
  })

  describe('Update behaviour', () => {
    it('flips type to credit and shifts invoiceCreationDate by 1ms', async () => {
      await mockLoginAs(users.globalAdmin)
      ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
      ;(Payment.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...debitPayment,
        type: Operations.Credit,
      })
      ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})
      ;(ProfitService.updatePayment as jest.Mock).mockResolvedValue({})

      const res = await performRequest('POST', debitPayment._id)

      expect(res.status).toHaveBeenCalledWith(200)
      const updateCall = (Payment.findOneAndUpdate as jest.Mock).mock.calls[0]
      expect(updateCall[0]).toEqual({ _id: debitPayment._id })
      expect(updateCall[1].$set.type).toBe(Operations.Credit)

      const expectedDate = new Date(
        new Date(debitPayment.invoiceCreationDate).getTime() + 1
      )
      expect(updateCall[1].$set.invoiceCreationDate.getTime()).toBe(
        expectedDate.getTime()
      )
    })

    it('writes PaymentChangeLog only after a successful update', async () => {
      await mockLoginAs(users.globalAdmin)
      ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
      ;(Payment.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...debitPayment,
        type: Operations.Credit,
      })
      ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})
      ;(ProfitService.updatePayment as jest.Mock).mockResolvedValue({})

      await performRequest('POST', debitPayment._id)

      expect(PaymentChangeLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: debitPayment._id,
          reason: 'mark-paid',
          actorEmail: users.globalAdmin.email,
        })
      )
    })

    it('does not write PaymentChangeLog when update fails', async () => {
      await mockLoginAs(users.globalAdmin)
      ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
      ;(Payment.findOneAndUpdate as jest.Mock).mockResolvedValue(null)

      const res = await performRequest('POST', debitPayment._id)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(PaymentChangeLog.create).not.toHaveBeenCalled()
    })

    it('returns 200 with already-paid marker for credit payment without re-updating', async () => {
      await mockLoginAs(users.globalAdmin)
      ;(Payment.findById as jest.Mock).mockResolvedValue(creditPayment)

      const res = await performRequest('POST', creditPayment._id)

      expect(res.status).toHaveBeenCalledWith(200)
      const json = (res.json as jest.Mock).mock.calls[0][0]
      expect(json.success).toBe(true)
      expect(json.message).toBe('already-paid')
      expect(Payment.findOneAndUpdate).not.toHaveBeenCalled()
      expect(PaymentChangeLog.create).not.toHaveBeenCalled()
    })

    it('returns 404 if payment does not exist', async () => {
      await mockLoginAs(users.globalAdmin)
      ;(Payment.findById as jest.Mock).mockResolvedValue(null)

      const res = await performRequest('POST', '64d68421d9ba2fc8fea79dff')

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('updates Profit only for global admin (not for domain admin)', async () => {
      await mockLoginAs(users.domainAdmin)
      ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
      ;(Domain.findOne as jest.Mock).mockResolvedValue({
        _id: debitPayment.domain,
        adminEmails: [users.domainAdmin.email],
      })
      ;(Payment.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...debitPayment,
        type: Operations.Credit,
      })
      ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

      await performRequest('POST', debitPayment._id)

      expect(ProfitService.updatePayment).not.toHaveBeenCalled()
    })
  })
})
