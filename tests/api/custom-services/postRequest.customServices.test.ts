import CustomService from '@modules/models/CustomService'
import handler from '@pages/api/custom-services'
import { getCurrentUser } from '@utils/getCurrentUser'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'

jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    isGlobalAdmin: false,
    isDomainAdmin: false,
    isUser: false,
    email: '',
  }),
}))
jest.mock('@modules/models/CustomService', () => ({
  create: jest.fn(),
  deleteMany: jest.fn(),
  find: jest.fn(),
}))

setupTestEnvironment()

describe('API Route - POST Method', () => {
  beforeEach(async () => {
    await CustomService.deleteMany({})
    jest.clearAllMocks()
  })

  const testCases = [
    { domainId: null, name: null, description: 'domainId and name = null' },
    {
      domainId: undefined,
      name: undefined,
      description: 'domainId and name = undefined',
    },
    { domainId: 0, name: 0, description: 'domainId and name = 0' },
    { domainId: ' ', name: ' ', description: 'domainId and name = " "' },
  ]

  testCases.forEach(({ domainId, name, description }) => {
    it(`should not create when ${description}`, async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
        isGlobalAdmin: true,
        isDomainAdmin: false,
        isUser: false,
      })

      const mockRequest = {
        method: 'POST',
        body: { domainId, name },
      } as any
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any

      await handler(mockRequest, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })
  })

  describe('Role-Based Access Control', () => {
    const validRequest = {
      method: 'POST',
      body: {
        domainId: 'validDomainId',
        name: 'Test Service',
      },
    }

    it('should block regular users', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
        isGlobalAdmin: false,
        isDomainAdmin: false,
        isUser: true,
        email: 'user@example.com',
      })

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any

      await handler(validRequest as any, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not allowed',
      })
    })

    it('should allow GlobalAdmin to create', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
        isGlobalAdmin: true,
        isDomainAdmin: false,
        isUser: false,
        email: 'admin@example.com',
      })
      ;(CustomService.create as jest.Mock).mockResolvedValueOnce({
        _id: 'mockedServiceId',
        name: 'Test Service',
        domain: 'validDomainId',
        toObject: jest.fn().mockReturnValue({
          _id: 'mockedServiceId',
          name: 'Test Service',
          domain: 'validDomainId',
        }),
      })

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any

      await handler(validRequest as any, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          _id: 'mockedServiceId',
          name: 'Test Service',
          domain: 'validDomainId',
        },
      })
    })

    it('should allow DomainAdmin to create (temp implementation)', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
        isGlobalAdmin: false,
        isDomainAdmin: true,
        isUser: false,
        email: 'domainadmin@example.com',
      })
      ;(CustomService.create as jest.Mock).mockResolvedValueOnce({
        _id: 'mockedServiceId',
        name: 'Test Service',
        domain: 'validDomainId',
        toObject: jest.fn().mockReturnValue({
          _id: 'mockedServiceId',
          name: 'Test Service',
          domain: 'validDomainId',
        }),
      })

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any

      await handler(validRequest as any, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          _id: 'mockedServiceId',
          name: 'Test Service',
          domain: 'validDomainId',
        },
      })
    })
  })
})
