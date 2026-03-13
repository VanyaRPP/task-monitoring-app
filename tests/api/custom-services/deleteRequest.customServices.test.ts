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

describe('API Route - DELETE Method', () => {
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

  it('should return 403 when id is missing', async () => {
    const mockRequest = {
      method: 'DELETE',
      query: {},
    } as any

    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(403)
  })

  it('should block regular users', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: false,
      isDomainAdmin: false,
      isUser: true,
      email: 'user@example.com',
    })

    const service = await mockServiceCreation(domains[0]._id)

    const mockRequest = {
      method: 'DELETE',
      query: { id: service._id },
    } as any

    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(403)
  })

  it('should allow GlobalAdmin to delete service', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: true,
      isDomainAdmin: false,
      isUser: false,
      email: 'admin@example.com',
    })

    const service = await mockServiceCreation(domains[0]._id)

    const mockRequest = {
      method: 'DELETE',
      query: { id: service._id },
    } as any

    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    const deleted = await CustomService.findById(service._id)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(deleted).toBeNull()
  })

  it('should return 404 if service not found', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: true,
      isDomainAdmin: false,
      isUser: false,
      email: 'admin@example.com',
    })

    const mockRequest = {
      method: 'DELETE',
      query: { id: '507f191e810c19729de860ea' },
    } as any

    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(404)
  })
})
