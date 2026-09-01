import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import handler from '@pages/api/custom-services'
import { getCurrentUser } from '@utils/getCurrentUser'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains } from '@utils/testData'

jest.mock('@pages/api/api.config', () => jest.fn())
// Default caller is a GlobalAdmin: the generic list tests below assert the
// "sees the whole catalog" behaviour. Role-specific tests override per-case.
jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    isGlobalAdmin: true,
    isDomainAdmin: false,
    isUser: false,
    user: { email: 'admin@example.com' },
  }),
}))

setupTestEnvironment()

describe('API Route - GET Method', () => {
  beforeEach(async () => {
    await CustomService.deleteMany({})
  })

  const mockServiceCreation = async (
    name = 'Test Service',
    fieldName = 'testService'
  ) => {
    return CustomService.create({ name, fieldName })
  }

  it('returns all services if _id is not passed', async () => {
    // Distinct names: listCustomServicesForDomain de-duplicates by name, so
    // two identically-named services would collapse into one.
    await mockServiceCreation('Test Service A', 'testServiceA')
    await mockServiceCreation('Test Service B', 'testServiceB')

    const mockRequest = { method: 'GET', query: {} } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json.mock.calls[0][0].data).toHaveLength(2)
  })

  it('returns service by _id', async () => {
    const service = await mockServiceCreation()

    const mockRequest = {
      method: 'GET',
      query: { _id: service._id.toString() },
    } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json.mock.calls[0][0].data).toHaveLength(1)
  })

  describe('Role-Based Access Control', () => {
    it('should block regular users', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
        isGlobalAdmin: false,
        isDomainAdmin: false,
        isUser: true,
        email: 'user@example.com',
      })

      const mockRequest = {
        method: 'GET',
        query: {},
      } as any
      const mockResponse = {
        status: jest.fn(() => mockResponse),
        json: jest.fn(),
      } as any

      await handler(mockRequest, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Не дозволено',
      })
    })

    it('should allow GlobalAdmin to access any domain', async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
        isGlobalAdmin: true,
        isDomainAdmin: false,
        isUser: false,
        email: 'admin@example.com',
      })

      await mockServiceCreation()

      const mockRequest = {
        method: 'GET',
        query: {},
      } as any
      const mockResponse = {
        status: jest.fn(() => mockResponse),
        json: jest.fn(),
      } as any

      await handler(mockRequest, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json.mock.calls[0][0].data).toHaveLength(1)
    })

    it('auto-scopes a DomainAdmin (no domainId) to only their own domains', async () => {
      // Option A: instead of 403, the backend resolves the caller's domains and
      // returns exactly — and only — their services. No leak, no empty catalog.
      const ownDomain = await Domain.create({
        name: 'Own Domain',
        adminEmails: ['domainadmin@example.com'],
        streets: [],
        description: 'own',
        customServices: [],
      })
      const foreignDomain = await Domain.create({
        name: 'Foreign Domain',
        adminEmails: ['someoneelse@example.com'],
        streets: [],
        description: 'foreign',
        customServices: [],
      })
      await CustomService.create({
        name: 'Own Service',
        fieldName: 'ownService',
        domain: ownDomain._id,
      })
      await CustomService.create({
        name: 'Foreign Service',
        fieldName: 'foreignService',
        domain: foreignDomain._id,
      })
      ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
        isGlobalAdmin: false,
        isDomainAdmin: true,
        isUser: false,
        user: { email: 'domainadmin@example.com' },
      })

      const mockRequest = { method: 'GET', query: {} } as any
      const mockResponse = {
        status: jest.fn(() => mockResponse),
        json: jest.fn(),
      } as any

      await handler(mockRequest, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      const data = mockResponse.json.mock.calls[0][0].data
      expect(data.some((s: any) => s.name === 'Own Service')).toBe(true)
      expect(data.some((s: any) => s.name === 'Foreign Service')).toBe(false)
    })

    it('forbids a DomainAdmin from a domain they do not administer', async () => {
      const foreignDomain = await Domain.create({
        name: 'Foreign Domain',
        adminEmails: ['someoneelse@example.com'],
        streets: [],
        description: 'foreign',
        customServices: [],
      })

      ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
        isGlobalAdmin: false,
        isDomainAdmin: true,
        isUser: false,
        user: { email: 'domainadmin@example.com' },
      })

      const mockRequest = {
        method: 'GET',
        query: { domainId: foreignDomain._id.toString() },
      } as any
      const mockResponse = {
        status: jest.fn(() => mockResponse),
        json: jest.fn(),
      } as any

      await handler(mockRequest, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(403)
    })
  })
  it('returns empty array when no services exist', async () => {
    const mockRequest = { method: 'GET', query: {} } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json.mock.calls[0][0].data).toHaveLength(0)
  })

  it('returns empty array when _id does not match any service', async () => {
    const mockRequest = {
      method: 'GET',
      query: { _id: '507f191e810c19729de860ea' },
    } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json.mock.calls[0][0].data).toHaveLength(0)
  })

  it('returns only domain-scoped services when domainId is passed', async () => {
    await CustomService.create({
      name: 'Domain Service',
      fieldName: 'domainService',
      domain: domains[0]._id,
    })
    await CustomService.create({
      name: 'Legacy Service',
      fieldName: 'legacyService',
    })

    const mockRequest = {
      method: 'GET',
      query: { domainId: domains[0]._id.toString() },
    } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    // має повернути і domain service і legacy (без domain)
    const data = mockResponse.json.mock.calls[0][0].data
    expect(data.some((s: any) => s.name === 'Domain Service')).toBe(true)
    expect(data.some((s: any) => s.name === 'Legacy Service')).toBe(true)
  })

  it('returns 400 when domainId is invalid', async () => {
    const mockRequest = {
      method: 'GET',
      query: { domainId: 'not-a-valid-id' },
    } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)
    expect(mockResponse.status).toHaveBeenCalledWith(400)
  })

  it('deduplicates services with the same name', async () => {
    await CustomService.create({
      name: 'Duplicate Name',
      fieldName: 'duplicateName1',
    })
    await CustomService.create({
      name: 'Duplicate Name',
      fieldName: 'duplicateName2',
    })

    const mockRequest = { method: 'GET', query: {} } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    const data = mockResponse.json.mock.calls[0][0].data
    const names = data.map((s: any) => s.name)
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })
})
