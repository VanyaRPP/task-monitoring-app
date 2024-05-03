import { expect } from '@jest/globals'
import handler from '../index'

import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { mockLoginAs } from '@utils/mockLoginAs'
import { domains,  users, streets } from '@utils/testData'
import { parseReceived } from '@utils/helpers'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('Domain API - GET', () => {
    it('load Domain as GlobalAdmin', async () => {
        await mockLoginAs(users.globalAdmin)
        
        const mockReq = {
            method: 'GET',
            query: {},
          } as any
          const mockRes = {
            status: jest.fn(() => mockRes),
            json: jest.fn(),
          } as any

          await handler(mockReq, mockRes)

          const response = {
            status: mockRes.status,
            data: mockRes.json.mock.lastCall[0].data,
          }

          expect(response.status).toHaveBeenCalledWith(200)
      
          const received = parseReceived(response.data)
      
          expect(received).toEqual(domains)
    }),
    it('load Domain as DomainAdmin', async () => {
        await mockLoginAs(users.domainAdmin)

        const mockReq = {
            method: 'GET',
            query: {},
          } as any
          const mockRes = {
            status: jest.fn(() => mockRes),
            json: jest.fn(),
          } as any

          await handler(mockReq, mockRes)

          const response = {
            status: mockRes.status,
            data: mockRes.json.mock.lastCall[0].data,
          }

          expect(response.status).toHaveBeenCalledWith(200)
      
          const received = parseReceived(response.data)
          const domain = domains.filter(domain => domain.adminEmails.includes('domainAdmin@example.com'))
          expect(received).toEqual(domain)
    }),
    it('shoult not load Domain as User', async () => {
      await mockLoginAs(users.user)

      const mockReq = {
          method: 'GET',
          query: {},
        } as any
        const mockRes = {
          status: jest.fn(() => mockRes),
          json: jest.fn(),
        } as any

        await handler(mockReq, mockRes)

        const response = {
          status: mockRes.status,
          data: mockRes.json.mock.lastCall[0].data,
        }

        expect(response.status).toHaveBeenCalledWith(200)
    
        const received = parseReceived(response.data)
        expect(received).toEqual([])
  })
    it('load Domain as GlobalAdmin with limit', async () => {
      await mockLoginAs(users.globalAdmin)
      const limit = 2
      
      const mockReq = {
          method: 'GET',
          query: { limit },
        } as any
        const mockRes = {
          status: jest.fn(() => mockRes),
          json: jest.fn(),
        } as any

        await handler(mockReq, mockRes)

        const response = {
          status: mockRes.status,
          data: mockRes.json.mock.lastCall[0].data,
        }

        expect(response.status).toHaveBeenCalledWith(200)
    
        const received = parseReceived(response.data)
        const domain = domains.slice(0, 2)
        expect(received).toEqual(domain)
  }),
    it('load Domain as GlobalAdmin with domain', async () => {
      await mockLoginAs(users.globalAdmin)
      
      const mockReq = {
          method: 'GET',
          query: { domainId: domains[0]._id },
        } as any
        const mockRes = {
          status: jest.fn(() => mockRes),
          json: jest.fn(),
        } as any

        await handler(mockReq, mockRes)

        const response = {
          status: mockRes.status,
          data: mockRes.json.mock.lastCall[0].data,
        }

        expect(response.status).toHaveBeenCalledWith(200)
    
        const received = parseReceived(response.data)
        const domain = domains.filter(domain => domain._id.includes(domains[0]._id))
        expect(received).toEqual(domain)
  }),
    it('load Domain as DomainAdmin with limit', async () => {
      await mockLoginAs(users.domainAdmin)
      const limit = 2  
      
      const mockReq = {
          method: 'GET',
          query: { limit },
        } as any
        const mockRes = {
          status: jest.fn(() => mockRes),
          json: jest.fn(),
        } as any

        await handler(mockReq, mockRes)

        const response = {
          status: mockRes.status,
          data: mockRes.json.mock.lastCall[0].data,
        }

        expect(response.status).toHaveBeenCalledWith(200)
    
        const received = parseReceived(response.data)
        const domain = domains.filter(domain => domain.adminEmails.includes('domainAdmin@example.com')).slice(0, 2)
        expect(received).toEqual(domain)
  }),
    it('load Domain as DomainAdmin with domain', async () => {
      await mockLoginAs(users.domainAdmin)
      
      const mockReq = {
          method: 'GET',
          query: { domainId: domains[0]._id },
        } as any
        const mockRes = {
          status: jest.fn(() => mockRes),
          json: jest.fn(),
        } as any

        await handler(mockReq, mockRes)

        const response = {
          status: mockRes.status,
          data: mockRes.json.mock.lastCall[0].data,
        }

        expect(response.status).toHaveBeenCalledWith(200)
    
        const received = parseReceived(response.data)
        const domain = domains.filter(domain => domain._id.includes(domains[0]._id) && domain.adminEmails.includes('domainAdmin@example.com'))
        expect(received).toEqual(domain)
  }), 
    it('should not load Domain as User with domain', async () => {
      await mockLoginAs(users.user)
      
      const mockReq = {
          method: 'GET',
          query: { domainId: domains[0]._id },
        } as any
        const mockRes = {
          status: jest.fn(() => mockRes),
          json: jest.fn(),
        } as any

        await handler(mockReq, mockRes)

        const response = {
          status: mockRes.status,
          data: mockRes.json.mock.lastCall[0].data,
        }

        expect(response.status).toHaveBeenCalledWith(200)
    
        const received = parseReceived(response.data)
        expect(received).toEqual([])
  }),
    it('should not load Domain as User with limit', async () => {
      await mockLoginAs(users.user)
      const limit = 2
      
      const mockReq = {
          method: 'GET',
          query: { domainId: limit },
        } as any
        const mockRes = {
          status: jest.fn(() => mockRes),
          json: jest.fn(),
        } as any

        await handler(mockReq, mockRes)

        const response = {
          status: mockRes.status,
          data: mockRes.json.mock.lastCall[0].data,
        }

        expect(response.status).toHaveBeenCalledWith(200)
    
        const received = parseReceived(response.data)
        expect(received).toEqual([])
  })
})