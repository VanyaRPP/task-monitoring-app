import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { getCurrentUser } from '@utils/getCurrentUser'
import handler from '../../../pages/api/streets/index'

jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@utils/getCurrentUser', () => ({ getCurrentUser: jest.fn() }))

const { expect } = require('@jest/globals')

setupTestEnvironment()

describe('API Route - POST Method', () => {
  it('should create a street when user is a global admin', async () => {
    const mockRequest = {
      method: 'POST',
      body: {
        address: 'Test Street 1',
        city: 'Test City',
      },
    } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    ;(getCurrentUser as any).mockResolvedValueOnce({ isGlobalAdmin: true })

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          address: 'Test Street 1',
          city: 'Test City',
        }),
      })
    )
  })

  it('should not create a street when user is not a global admin', async () => {
    const mockRequest = {
      method: 'POST',
      body: {
        address: 'Test Street 2',
        city: 'Test City',
      },
    } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    ;(getCurrentUser as any).mockResolvedValueOnce({ isGlobalAdmin: false })

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'not allowed',
      })
    )
  })

  it('should return 400 if street creation fails', async () => {
    const mockRequest = {
      method: 'POST',
      body: {},
    } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    ;(getCurrentUser as any).mockResolvedValueOnce({ isGlobalAdmin: true })

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({ success: false })
  })

  it('should return 400 if empty strings are passed for street creation', async () => {
    const mockRequest = {
      method: 'POST',
      body: {
        address: '',
        city: '',
      },
    } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    ;(getCurrentUser as any).mockResolvedValueOnce({ isGlobalAdmin: true })

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({ success: false })
  })
})
