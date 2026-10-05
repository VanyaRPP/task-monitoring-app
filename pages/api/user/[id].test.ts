import handler from './[id]'
import User from '@modules/models/User'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import { Roles } from '@utils/constants'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(() => ({
    user: {
      _id: 'admin-id',
      email: 'admin@test.com',
    },
    isGlobalAdmin: true,
    isDomainAdmin: false,
  })),
}))

describe('/api/user/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return adminDomains and adminCompanies', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@test.com',
        toObject: () => ({
          _id: '123',
          email: 'test@test.com',
        }),
      }

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser as any)

      jest.spyOn(Domain, 'find').mockResolvedValue([{ name: 'Rozetka' }] as any)

      jest
        .spyOn(RealEstate, 'find')
        .mockResolvedValue([{ companyName: 'TestCompany' }] as any)

      const req = {
        method: 'GET',
        query: { id: '123' },
      } as any

      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      } as any

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            adminDomains: expect.any(Array),
            adminCompanies: expect.any(Array),
          }),
        })
      )
    })
  })

  describe('PATCH', () => {
    it('should update domains/companies and keep roles', async () => {
      jest.spyOn(User, 'findById').mockResolvedValue({
        email: 'user@test.com',
      } as any)

      jest.spyOn(Domain, 'updateMany').mockResolvedValue({} as any)

      jest.spyOn(RealEstate, 'updateMany').mockResolvedValue({} as any)

      jest.spyOn(User, 'updateOne').mockResolvedValue({} as any)

      const req = {
        method: 'PATCH',
        query: {
          id: '123',
        },
        body: {
          roles: ['DomainAdmin'],
          adminDomains: ['d1'],
          adminCompanies: ['c1'],
        },
      } as any

      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      } as any

      await handler(req, res)

      expect(Domain.updateMany).toHaveBeenCalled()
      expect(RealEstate.updateMany).toHaveBeenCalled()

      expect(User.updateOne).toHaveBeenCalledWith(
        { _id: '123' },
        expect.objectContaining({
          roles: ['DomainAdmin'],
        })
      )

      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should reject role escalation from a non-global user (closed isFirstLogin hole)', async () => {
      const { getCurrentUser } = require('@utils/getCurrentUser')
      ;(getCurrentUser as jest.Mock).mockReturnValueOnce({
        user: { _id: '123', email: 'user@test.com' },
        isGlobalAdmin: false,
        isDomainAdmin: false,
      })

      const req = {
        method: 'PATCH',
        query: { id: '123' },
        body: { roles: ['GlobalAdmin'], isFirstLogin: false },
      } as any

      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      } as any

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('should not allow DOMAIN_ADMIN to edit another DOMAIN_ADMIN', async () => {
      const { getCurrentUser } = require('@utils/getCurrentUser')

      ;(getCurrentUser as jest.Mock).mockReturnValueOnce({
        user: {
          _id: 'domain-admin-1',
          email: 'admin1@test.com',
        },
        isGlobalAdmin: false,
        isDomainAdmin: true,
      })

      const updateOneSpy = jest.spyOn(User, 'updateOne')

      const req = {
        method: 'PATCH',
        query: {
          id: 'domain-admin-2',
        },
        body: {
          name: 'Changed name',
        },
      } as any

      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      } as any

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(updateOneSpy).not.toHaveBeenCalled()
    })

    it('should allow GLOBAL_ADMIN to edit another DOMAIN_ADMIN', async () => {
      const { getCurrentUser } = require('@utils/getCurrentUser')

      ;(getCurrentUser as jest.Mock).mockReturnValueOnce({
        user: {
          _id: 'global-admin-1',
          email: 'global@test.com',
        },
        isGlobalAdmin: true,
        isDomainAdmin: false,
      })

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: 'domain-admin-2',
        email: 'domain-admin@test.com',
        roles: [Roles.DOMAIN_ADMIN],
      } as any)

      const updateOneSpy = jest
        .spyOn(User, 'updateOne')
        .mockResolvedValue({} as any)

      const req = {
        method: 'PATCH',
        query: {
          id: 'domain-admin-2',
        },
        body: {
          name: 'Changed name',
        },
      } as any

      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      } as any

      await handler(req, res)

      expect(updateOneSpy).toHaveBeenCalledWith(
        { _id: 'domain-admin-2' },
        expect.objectContaining({
          name: 'Changed name',
        })
      )

      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('DELETE', () => {
    it('should not allow DOMAIN_ADMIN to delete another DOMAIN_ADMIN', async () => {
      const { getCurrentUser } = require('@utils/getCurrentUser')

      ;(getCurrentUser as jest.Mock).mockReturnValueOnce({
        user: {
          _id: 'domain-admin-1',
          email: 'admin1@test.com',
        },
        isGlobalAdmin: false,
        isDomainAdmin: true,
      })

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: 'domain-admin-2',
        email: 'admin2@test.com',
        roles: [Roles.DOMAIN_ADMIN],
      } as any)

      const deleteSpy = jest.spyOn(User, 'findByIdAndDelete')

      const req = {
        method: 'DELETE',
        query: {
          id: 'domain-admin-2',
        },
      } as any

      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      } as any

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "You can't delete another domain admin",
      })

      expect(deleteSpy).not.toHaveBeenCalled()
    })

    it('should allow GLOBAL_ADMIN to delete another DOMAIN_ADMIN', async () => {
      const { getCurrentUser } = require('@utils/getCurrentUser')

      ;(getCurrentUser as jest.Mock).mockReturnValueOnce({
        user: {
          _id: 'global-admin-1',
          email: 'global@test.com',
        },
        isGlobalAdmin: true,
        isDomainAdmin: false,
      })

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: 'domain-admin-2',
        email: 'admin2@test.com',
        roles: [Roles.DOMAIN_ADMIN],
      } as any)

      const deleteSpy = jest
        .spyOn(User, 'findByIdAndDelete')
        .mockResolvedValue({} as any)

      const req = {
        method: 'DELETE',
        query: {
          id: 'domain-admin-2',
        },
      } as any

      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      } as any

      await handler(req, res)

      expect(deleteSpy).toHaveBeenCalledWith('domain-admin-2')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
      })
    })

    it('should allow DOMAIN_ADMIN to delete a regular USER from their domain', async () => {
      const { getCurrentUser } = require('@utils/getCurrentUser')

      ;(getCurrentUser as jest.Mock).mockReturnValueOnce({
        user: {
          _id: 'domain-admin-1',
          email: 'admin@test.com',
        },
        isGlobalAdmin: false,
        isDomainAdmin: true,
      })

      jest.spyOn(User, 'findById').mockResolvedValue({
        _id: 'user-2',
        email: 'user@test.com',
        roles: [Roles.USER],
      } as any)

      jest.spyOn(Domain, 'find').mockResolvedValue([
        {
          adminEmails: ['admin@test.com', 'user@test.com'],
        },
      ] as any)

      const deleteSpy = jest
        .spyOn(User, 'findByIdAndDelete')
        .mockResolvedValue({} as any)

      const req = {
        method: 'DELETE',
        query: {
          id: 'user-2',
        },
      } as any

      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      } as any

      await handler(req, res)

      expect(deleteSpy).toHaveBeenCalledWith('user-2')
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })
})
