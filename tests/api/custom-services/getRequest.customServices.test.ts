import CustomService from '@modules/models/CustomService'
import handler from '@pages/api/custom-services'
import { getCurrentUser } from '@utils/getCurrentUser'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains } from '@utils/testData'

jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    isGlobalAdmin: false,
    isDomainAdmin: false,
    isUser: false,
    email: '',
  }),
}))

setupTestEnvironment()

describe('API Route - GET Method', () => {
  beforeEach(async () => {
    await CustomService.deleteMany({})
  })

  const mockServiceCreation = async (domainId: string) => {
    return CustomService.create({
      name: 'Test Service',
      fieldName: 'testService',
      domain: domainId,
    })
  }

  const testCases = [
    { domainId: null, description: 'domainId = null' },
    { domainId: undefined, description: 'domainId = undefined' },
    { domainId: 0, description: 'domainId = 0' },
    { domainId: ' ', description: 'domainId = " "' },
  ]

  testCases.forEach(({ domainId, description }) => {
    it(`should not load when ${description}`, async () => {
      const mockRequest = { method: 'GET', query: { domainId } } as any
      const mockResponse = {
        status: jest.fn(() => mockResponse),
        json: jest.fn(),
      } as any

      await handler(mockRequest, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(400)
    })
  })

  describe('Role-Based Access Control', () => {
    it('should block regular users', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
        isGlobalAdmin: false,
        isDomainAdmin: false,
        isUser: true,
        email: 'user@example.com',
      })

      const validDomainId = domains[0]._id
      await mockServiceCreation(validDomainId)

      const mockRequest = {
        method: 'GET',
        query: { domainId: validDomainId },
      } as any
      const mockResponse = {
        status: jest.fn(() => mockResponse),
        json: jest.fn(),
      } as any

      await handler(mockRequest, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not allowed',
      })
    })

    it('should allow GlobalAdmin to access any domain', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
        isGlobalAdmin: true,
        isDomainAdmin: false,
        isUser: false,
        email: 'admin@example.com',
      })

      const validDomainId = domains[0]._id
      await mockServiceCreation(validDomainId)

      const mockRequest = {
        method: 'GET',
        query: { domainId: validDomainId },
      } as any
      const mockResponse = {
        status: jest.fn(() => mockResponse),
        json: jest.fn(),
      } as any

      await handler(mockRequest, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json.mock.calls[0][0].data).toHaveLength(1)
    })

    it('should allow DomainAdmin to access any domain (temp implementation)', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
        isGlobalAdmin: false,
        isDomainAdmin: true,
        isUser: false,
        email: 'domainadmin@example.com',
      })

      const validDomainId = domains[0]._id
      await mockServiceCreation(validDomainId)

      const mockRequest = {
        method: 'GET',
        query: { domainId: validDomainId },
      } as any
      const mockResponse = {
        status: jest.fn(() => mockResponse),
        json: jest.fn(),
      } as any

      await handler(mockRequest, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json.mock.calls[0][0].data).toHaveLength(1)
    })
  })
})
