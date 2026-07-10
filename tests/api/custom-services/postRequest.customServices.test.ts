import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@pages/api/custom-services'
import { getCurrentUser } from '@utils/getCurrentUser'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'

jest.mock('@pages/api/api.config', () => jest.fn())

jest.mock('@modules/models/CustomService', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  },
}))

import CustomService from '@modules/models/CustomService'

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

const mockGetCurrentUser = getCurrentUser as jest.Mock
const mockCustomService = CustomService as unknown as {
  create: jest.Mock
  deleteMany: jest.Mock
  find: jest.Mock
  findOne: jest.Mock
}

setupTestEnvironment()

describe('API Route - POST Method', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    mockCustomService.deleteMany.mockResolvedValue({})
  })

  const testCases = [
    { name: null, description: 'name = null' },
    { name: undefined, description: 'name = undefined' },
    { name: 0, description: 'name = 0' },
    { name: ' ', description: 'name = " "' },
  ]

  testCases.forEach(({ name, description }) => {
    it(`should not create when ${description}`, async () => {
      mockGetCurrentUser.mockResolvedValueOnce({
        isGlobalAdmin: true,
        isDomainAdmin: false,
        isUser: false,
      })

      mockCustomService.findOne.mockResolvedValueOnce(null)

      const mockReq = {
        method: 'POST',
        query: { domainId: 'valid-domain-id' },
        body: { name },
      }

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as NextApiResponse

      await handler(mockReq as any, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
    })
  })

  describe('Role-Based Access Control', () => {
    const validReq = {
      method: 'POST',
      query: { domainId: 'valid-domain-id' },
      body: { name: 'Test Service' },
    } as unknown as NextApiRequest

    it('should block regular users', async () => {
      mockGetCurrentUser.mockResolvedValueOnce({
        isGlobalAdmin: false,
        isDomainAdmin: false,
        isUser: true,
      })

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as NextApiResponse

      await handler(validReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Не дозволено',
      })
    })

    it('should allow GlobalAdmin to create', async () => {
      mockGetCurrentUser.mockResolvedValueOnce({
        isGlobalAdmin: true,
        isDomainAdmin: false,
        isUser: false,
      })

      mockCustomService.findOne.mockResolvedValueOnce(null)

      mockCustomService.create.mockResolvedValueOnce({
        _id: 'mockedServiceId',
        name: 'Test Service',
        fieldName: 'testService',
        toObject: jest.fn().mockReturnValue({
          _id: 'mockedServiceId',
          name: 'Test Service',
          fieldName: 'testService',
        }),
      })

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as NextApiResponse

      await handler(validReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          _id: 'mockedServiceId',
          name: 'Test Service',
          fieldName: 'testService',
        },
      })
    })

    it('should allow DomainAdmin to create', async () => {
      mockGetCurrentUser.mockResolvedValueOnce({
        isGlobalAdmin: false,
        isDomainAdmin: true,
        isUser: false,
      })

      mockCustomService.findOne.mockResolvedValueOnce(null)

      mockCustomService.create.mockResolvedValueOnce({
        _id: 'mockedServiceId',
        name: 'Test Service',
        fieldName: 'testService',
        toObject: jest.fn().mockReturnValue({
          _id: 'mockedServiceId',
          name: 'Test Service',
          fieldName: 'testService',
        }),
      })

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as NextApiResponse

      await handler(validReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          _id: 'mockedServiceId',
          name: 'Test Service',
          fieldName: 'testService',
        },
      })
    })
  })
})
