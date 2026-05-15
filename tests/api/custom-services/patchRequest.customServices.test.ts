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

describe('API Route - PATCH Method', () => {
  beforeEach(async () => {
    await CustomService.deleteMany({})
  })

  const mockServiceCreation = async (domainId: string) => {
    return CustomService.create({
      name: 'Old Service Name',
      fieldName: 'oldServiceName',
      domain: domainId,
    })
  }

  it('should block regular users', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: false,
      isDomainAdmin: false,
      isUser: true,
      email: 'user@example.com',
    })

    const service = await mockServiceCreation(domains[0]._id)

    const mockRequest = {
      method: 'PATCH',
      query: { id: service._id },
      body: { name: 'New Name' },
    } as any

    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(403)
  })

  it('should allow GlobalAdmin to edit service', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: true,
      isDomainAdmin: false,
      isUser: false,
      email: 'admin@example.com',
    })

    const service = await mockServiceCreation(domains[0]._id)

    const mockRequest = {
      method: 'PATCH',
      query: { id: service._id },
      body: { name: 'New Service Name' },
    } as any

    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    const updated = await CustomService.findById(service._id)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(updated?.name).toBe('New Service Name')
  })

  it('should allow DomainAdmin to edit service', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: false,
      isDomainAdmin: true,
      isUser: false,
      email: 'domainadmin@example.com',
    })

    const service = await mockServiceCreation(domains[0]._id)

    const mockRequest = {
      method: 'PATCH',
      query: { id: service._id },
      body: { name: 'Renamed By DomainAdmin' },
    } as any

    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    const updated = await CustomService.findById(service._id)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(updated?.name).toBe('Renamed By DomainAdmin')
  })

  it('should return 400 when name is empty', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: false,
      isDomainAdmin: true,
      isUser: false,
      email: 'domainadmin@example.com',
    })

    const service = await mockServiceCreation(domains[0]._id)

    const mockRequest = {
      method: 'PATCH',
      query: { id: service._id },
      body: { name: '   ' },
    } as any

    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
  })

  it('should return 409 if service name already exists', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: false,
      isDomainAdmin: true,
      isUser: false,
      email: 'domainadmin@example.com',
    })

    await CustomService.create({
      name: 'Existing Service',
      fieldName: 'existingService',
      domain: domains[0]._id,
    })
    const service = await mockServiceCreation(domains[0]._id)

    const mockRequest = {
      method: 'PATCH',
      query: { id: service._id },
      body: { name: 'Existing Service' },
    } as any

    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(409)
  })

  it('should return 404 if service not found', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: false,
      isDomainAdmin: true,
      isUser: false,
      email: 'domainadmin@example.com',
    })

    const mockRequest = {
      method: 'PATCH',
      query: { id: '507f191e810c19729de860ea' },
      body: { name: 'Any Name' },
    } as any

    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(404)
  })
})
