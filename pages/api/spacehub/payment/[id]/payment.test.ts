import { expect } from '@jest/globals'
import { getServerSession } from 'next-auth'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { payments, users } from '@utils/testData'
import handler from '.'
import Payment from '@common/modules/models/Payment'
import Domain from '@modules/models/Domain'
import RealEstate from '@common/modules/models/RealEstate'
import PaymentChangeLog from '@common/modules/models/PaymentChangeLog'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

jest.mock('@common/modules/models/Payment')
jest.mock('@common/modules/models/PaymentChangeLog')
jest.mock('@modules/models/Domain')
jest.mock('@common/modules/models/RealEstate')

setupTestEnvironment()

describe('Payment API Endpoint - [id]', () => {
  const performRequest = async (
    method: 'PATCH' | 'DELETE' | 'GET' | 'PUT',
    id: any,
    body?: any
  ) => {
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

    await handler(mockReq, mockRes)
    return mockRes
  }

  const debitPayment = payments.find((p) => p.type === 'debit') as any

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockReset()
    // Domain is mocked in this suite, so getCurrentUser's role derivation sees
    // no domains and would demote seeded DomainAdmins. Reflect reality: a
    // domain exists, so derived roles stay stable (per-domain ownership is still
    // enforced by the handler via Domain.findOne).
    ;(Domain.exists as jest.Mock).mockResolvedValue(true)
  })

  describe('Auth & method handling', () => {
    it('returns 401 when no session/user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { email: 'ghost@example.com', roles: [] },
      })
      const res = await performRequest('GET', debitPayment._id)
      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('returns 405 for unsupported method', async () => {
      await mockLoginAs(users.globalAdmin)
      const res = await performRequest('PUT', debitPayment._id)
      expect(res.status).toHaveBeenCalledWith(405)
    })
  })

  describe('GET - Permission Checks', () => {
    it('should allow GlobalAdmin to get any payment', async () => {
      await mockLoginAs(users.globalAdmin)
      ;(Payment.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        ...debitPayment,
      })

      const res = await performRequest('GET', debitPayment._id)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      )
    })

    it('should return 404 when payment not found', async () => {
      await mockLoginAs(users.globalAdmin)
      ;(Payment.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve(null),
      })

      const res = await performRequest('GET', debitPayment._id)
      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('should return 403 when domain admin has no access to payment domain', async () => {
      await mockLoginAs(users.domainAdmin2)
      ;(Payment.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        ...debitPayment,
        domain: { adminEmails: ['someone-else@example.com'] },
        company: { adminEmails: [] },
      })

      const res = await performRequest('GET', debitPayment._id)
      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('should return 400 if DB error occurs', async () => {
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

      ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
      ;(Payment.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...debitPayment,
        ...updateData,
      })
      ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

      const res = await performRequest('PATCH', debitPayment._id, updateData)

      expect(res.status).toHaveBeenCalledWith(200)
      const jsonResponse = (res.json as jest.Mock).mock.calls[0][0]
      expect(jsonResponse.success).toBe(true)
      expect(jsonResponse.data.description).toBe('Updated')

      expect(PaymentChangeLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: 'UPDATE', source: 'single' })
      )
      const auditArg = (PaymentChangeLog.create as jest.Mock).mock.calls[0][0]
      expect(auditArg.before).toBeDefined()
      expect(auditArg.after).toBeDefined()
      expect(auditArg.after.description).toBe('Updated')
      expect(auditArg.before.description).not.toBe(auditArg.after.description)
    })

    it('should return 403 for regular User', async () => {
      await mockLoginAs(users.user)
      ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
      const res = await performRequest('PATCH', debitPayment._id, {
        description: 'hack',
      })
      expect(res.status).toHaveBeenCalledWith(403)
      expect(Payment.findOneAndUpdate).not.toHaveBeenCalled()
      expect(PaymentChangeLog.create).not.toHaveBeenCalled()
    })

    it('should return 404 when payment not found', async () => {
      await mockLoginAs(users.globalAdmin)
      ;(Payment.findById as jest.Mock).mockResolvedValue(null)
      const res = await performRequest('PATCH', debitPayment._id, {
        description: 'x',
      })
      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('allows domain admin to PATCH own-domain payment', async () => {
      await mockLoginAs(users.domainAdmin)
      ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
      ;(Domain.findOne as jest.Mock).mockResolvedValue({
        _id: debitPayment.domain,
        adminEmails: [users.domainAdmin.email],
      })
      ;(Payment.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...debitPayment,
        description: 'updated',
      })
      ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

      const res = await performRequest('PATCH', debitPayment._id, {
        description: 'updated',
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(Domain.findOne).toHaveBeenCalledWith({
        _id: debitPayment.domain,
        adminEmails: { $in: [users.domainAdmin.email] },
      })
    })

    it('forbids domain admin on foreign-domain payment', async () => {
      await mockLoginAs(users.domainAdmin2)
      ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
      ;(Domain.findOne as jest.Mock).mockResolvedValue(null)

      const res = await performRequest('PATCH', debitPayment._id, {
        description: 'hack',
      })
      expect(res.status).toHaveBeenCalledWith(403)
      expect(Payment.findOneAndUpdate).not.toHaveBeenCalled()
    })

    describe('Template scope', () => {
      it('GlobalAdmin can set company default template', async () => {
        await mockLoginAs(users.globalAdmin)
        ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
        ;(RealEstate.findByIdAndUpdate as jest.Mock).mockResolvedValue({})
        ;(Payment.findOneAndUpdate as jest.Mock).mockResolvedValue(debitPayment)

        const res = await performRequest('PATCH', debitPayment._id, {
          template: 'olimp',
          _templateScope: 'company',
        })

        expect(res.status).toHaveBeenCalledWith(200)
        expect(RealEstate.findByIdAndUpdate).toHaveBeenCalledWith(
          debitPayment.company.toString(),
          { $set: { defaultTemplate: 'olimp' } }
        )
      })

      it('DomainAdmin cannot set company default template', async () => {
        await mockLoginAs(users.domainAdmin)
        ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)

        const res = await performRequest('PATCH', debitPayment._id, {
          template: 'olimp',
          _templateScope: 'company',
        })

        expect(res.status).toHaveBeenCalledWith(403)
        expect(RealEstate.findByIdAndUpdate).not.toHaveBeenCalled()
        expect(Payment.findOneAndUpdate).not.toHaveBeenCalled()
      })

      it('DomainAdmin of payment domain can set domain default template', async () => {
        await mockLoginAs(users.domainAdmin)
        ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
        ;(Domain.findOne as jest.Mock).mockResolvedValue({
          _id: debitPayment.domain,
          adminEmails: [users.domainAdmin.email],
        })
        ;(Domain.findByIdAndUpdate as jest.Mock).mockResolvedValue({})
        ;(Payment.findOneAndUpdate as jest.Mock).mockResolvedValue(debitPayment)

        const res = await performRequest('PATCH', debitPayment._id, {
          template: 'olimp',
          _templateScope: 'domain',
        })

        expect(res.status).toHaveBeenCalledWith(200)
        expect(Domain.findByIdAndUpdate).toHaveBeenCalledWith(
          debitPayment.domain.toString(),
          { $set: { defaultTemplate: 'olimp' } }
        )
      })

      it('DomainAdmin of a foreign domain cannot set domain default template', async () => {
        await mockLoginAs(users.domainAdmin2)
        ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
        ;(Domain.findOne as jest.Mock).mockResolvedValue(null)

        const res = await performRequest('PATCH', debitPayment._id, {
          template: 'olimp',
          _templateScope: 'domain',
        })

        expect(res.status).toHaveBeenCalledWith(403)
        expect(Domain.findByIdAndUpdate).not.toHaveBeenCalled()
        expect(Payment.findOneAndUpdate).not.toHaveBeenCalled()
      })

      it('GlobalAdmin can set domain default template without owning domain', async () => {
        await mockLoginAs(users.globalAdmin)
        ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
        ;(Domain.findByIdAndUpdate as jest.Mock).mockResolvedValue({})
        ;(Payment.findOneAndUpdate as jest.Mock).mockResolvedValue(debitPayment)

        const res = await performRequest('PATCH', debitPayment._id, {
          template: 'olimp',
          _templateScope: 'domain',
        })

        expect(res.status).toHaveBeenCalledWith(200)
        expect(Domain.findOne).not.toHaveBeenCalled()
        expect(Domain.findByIdAndUpdate).toHaveBeenCalledWith(
          debitPayment.domain.toString(),
          { $set: { defaultTemplate: 'olimp' } }
        )
      })
    })

    it('strips _id, domain, company from req.body so admin cannot reassign payment', async () => {
      await mockLoginAs(users.domainAdmin)
      ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
      ;(Domain.findOne as jest.Mock).mockResolvedValue({
        _id: debitPayment.domain,
        adminEmails: [users.domainAdmin.email],
      })
      ;(Payment.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...debitPayment,
        description: 'updated',
      })
      ;(PaymentChangeLog.create as jest.Mock).mockResolvedValue({})

      await performRequest('PATCH', debitPayment._id, {
        description: 'updated',
        _id: 'forged-id',
        domain: 'foreign-domain-id',
        company: 'foreign-company-id',
      })

      const updateArg = (Payment.findOneAndUpdate as jest.Mock).mock.calls[0][1]
      expect(updateArg).not.toHaveProperty('_id')
      expect(updateArg).not.toHaveProperty('domain')
      expect(updateArg).not.toHaveProperty('company')
      expect(updateArg.description).toBe('updated')
    })
  })

  describe('DELETE - Permission Checks', () => {
    it('should allow GlobalAdmin to delete', async () => {
      await mockLoginAs(users.globalAdmin)
      ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
      ;(Payment.findByIdAndRemove as jest.Mock).mockResolvedValue(debitPayment)

      const res = await performRequest('DELETE', debitPayment._id)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(PaymentChangeLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'DELETE',
          source: 'single',
          before: expect.objectContaining({ _id: debitPayment._id }),
        })
      )
    })

    it('should return 403 for NoRole user', async () => {
      await mockLoginAs(users.noRoleUser)
      const res = await performRequest('DELETE', debitPayment._id)
      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('should return 404 when payment not found', async () => {
      await mockLoginAs(users.globalAdmin)
      ;(Payment.findById as jest.Mock).mockResolvedValue(null)
      const res = await performRequest('DELETE', debitPayment._id)
      expect(res.status).toHaveBeenCalledWith(404)
      expect(Payment.findByIdAndRemove).not.toHaveBeenCalled()
    })

    it('allows domain admin to DELETE own-domain payment', async () => {
      await mockLoginAs(users.domainAdmin)
      ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
      ;(Domain.findById as jest.Mock).mockResolvedValue({
        _id: debitPayment.domain,
        adminEmails: [users.domainAdmin.email],
      })
      ;(Payment.findByIdAndRemove as jest.Mock).mockResolvedValue(debitPayment)

      const res = await performRequest('DELETE', debitPayment._id)
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('forbids domain admin on foreign-domain payment', async () => {
      await mockLoginAs(users.domainAdmin2)
      ;(Payment.findById as jest.Mock).mockResolvedValue(debitPayment)
      ;(Domain.findById as jest.Mock).mockResolvedValue({
        _id: debitPayment.domain,
        adminEmails: ['someone-else@example.com'],
      })

      const res = await performRequest('DELETE', debitPayment._id)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(Payment.findByIdAndRemove).not.toHaveBeenCalled()
    })
  })
})
