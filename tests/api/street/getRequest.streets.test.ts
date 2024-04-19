import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { getCurrentUser } from '@utils/getCurrentUser'
import Domain from '@common/modules/models/Domain'
import Street from '@common/modules/models/Street'
import handler from '../../../pages/api/streets/index'
import { testStreetsData, testDomainsData } from './mockData'

jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@utils/getCurrentUser', () => ({ getCurrentUser: jest.fn() }))

const { expect } = require('@jest/globals')

setupTestEnvironment()

describe('API Route - GET Method', () => {
  it('should return streets with limit', async () => {
    ;(getCurrentUser as any).mockResolvedValueOnce({})
    await (Street as any).insertMany(testStreetsData)

    const mockRequest = { method: 'GET', query: { limit: 2 } } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    const responseData = mockResponse.json.mock.calls[0][0].data
    expect(responseData).toHaveLength(2)
  })

  it('should return streets by domainId', async () => {
    ;(getCurrentUser as any).mockResolvedValueOnce({})
    await (Domain as any).insertMany(testDomainsData)
    await (Street as any).insertMany(testStreetsData)

    const mockRequest = {
      method: 'GET',
      query: { domainId: '6494665488f76005bc1f7984' },
    } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    const responseData = mockResponse.json.mock.calls[0][0].data
    expect(responseData).toHaveLength(1)
  })
  it('should return street if limit is negative', async () => {
    ;(getCurrentUser as any).mockResolvedValueOnce({})
    await (Street as any).insertMany(testStreetsData)

    const mockRequest = {
      method: 'GET',
      query: { limit: -3 },
    } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    const responseData = mockResponse.json.mock.calls[0][0].data
    expect(responseData).toHaveLength(testStreetsData.length)
  })

  it('should return 400 if an error occurs during database query', async () => {
    ;(getCurrentUser as any).mockResolvedValueOnce({})

    const mockRequest = { method: 'GET' } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    jest.spyOn(Street, 'find').mockImplementationOnce(() => {
      throw new Error('Database error')
    })

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({ success: false })
  })

  it('should return empty array if domainId is not found', async () => {
    ;(getCurrentUser as any).mockResolvedValueOnce({})
    await (Street as any).insertMany(testStreetsData)

    const mockRequest = {
      method: 'GET',
      query: { domainId: '649324b7ff4981c7363ceb34' },
    } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    const responseData = mockResponse.json.mock.calls[0][0].data
    expect(responseData).toEqual([])
  })

  it('should return error without limit or domainId', async () => {
    ;(getCurrentUser as any).mockResolvedValueOnce({})
    await (Street as any).insertMany(testStreetsData)

    const mockRequest = { method: 'GET' } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({ success: false })
  })
})
