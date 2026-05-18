import Domain from '@modules/models/Domain'
import Street from '@modules/models/Street'
import Service from '@modules/models/Service'
import handler from '@pages/api/streets/index'
import { getCurrentUser } from '@utils/getCurrentUser'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { testDomainsData, testStreetsData } from './mockData'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@utils/getCurrentUser', () => ({ getCurrentUser: jest.fn() }))

const { expect } = require('@jest/globals')

setupTestEnvironment()

const createMockRequest = (overrides: Partial<any> = {}) =>
  ({
    method: 'GET',
    query: {},
    ...overrides,
  } as any)

const createMockResponse = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn()
  return res
}

describe('API Route - GET Method', () => {
  it('should return streets with limit', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: true,
      isDomainAdmin: false,
      isUser: false,
      user: { email: 'admin@test.com' },
    })

    await (Street as any).insertMany(testStreetsData)

    const mockRequest = createMockRequest({ query: { limit: 2 } })
    const mockResponse = createMockResponse()

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    const responseData = mockResponse.json.mock.calls[0][0].data
    expect(responseData).toHaveLength(2)
  })

  it('should return streets by domainId', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: true,
      isDomainAdmin: false,
      isUser: false,
      user: { email: 'admin@test.com' },
    })

    await (Domain as any).insertMany(testDomainsData)
    await (Street as any).insertMany(testStreetsData)

    const mockRequest = createMockRequest({
      query: { domainId: '6494665488f76005bc1f7984' },
    })
    const mockResponse = createMockResponse()

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    const responseData = mockResponse.json.mock.calls[0][0].data
    expect(responseData).toHaveLength(1)
  })
  it('should return street if limit is negative', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: true,
      isDomainAdmin: false,
      isUser: false,
      user: { email: 'admin@test.com' },
    })

    await (Street as any).insertMany(testStreetsData)

    const mockRequest = createMockRequest({
      query: { limit: -3 },
    })
    const mockResponse = createMockResponse()

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    const responseData = mockResponse.json.mock.calls[0][0].data
    expect(responseData).toHaveLength(testStreetsData.length)
  })

  it('should return 400 if an error occurs during database query', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: true,
      isDomainAdmin: false,
      isUser: false,
      user: { email: 'admin@test.com' },
    })

    const mockRequest = createMockRequest({ query: { limit: 10 } })
    const mockResponse = createMockResponse()

    jest.spyOn(Street, 'find').mockImplementationOnce(() => {
      throw new Error('Database error')
    })

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    )
  })

  it('should return empty array if domainId is not found', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: true,
      isDomainAdmin: false,
      isUser: false,
      user: { email: 'admin@test.com' },
    })

    await (Street as any).insertMany(testStreetsData)

    const mockRequest = createMockRequest({
      query: { domainId: '649324b7ff4981c7363ceb34' },
    })
    const mockResponse = createMockResponse()

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    const responseData = mockResponse.json.mock.calls[0][0].data
    expect(responseData).toEqual([])
  })

  it('should return error for invalid user role', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      isGlobalAdmin: false,
      isDomainAdmin: false,
      isUser: false,
      user: null,
    })

    await (Street as any).insertMany(testStreetsData)

    const mockRequest = createMockRequest({ query: {} })
    const mockResponse = createMockResponse()

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Invalid user role or parameters',
      })
    )
  })
})
