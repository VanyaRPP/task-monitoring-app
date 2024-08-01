import Street from '@modules/models/Street'
import handler from '@pages/api/streets/[id]'
import { getCurrentUser } from '@utils/getCurrentUser'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'

jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@utils/getCurrentUser', () => ({ getCurrentUser: jest.fn() }))

const { expect } = require('@jest/globals')

setupTestEnvironment()

describe('API Route - DELETE Method', () => {
  it('should delete a street successfully', async () => {
    const testStreetId = '649324b7ff4981c7363ceb31'
    ;(getCurrentUser as any).mockResolvedValueOnce({ isGlobalAdmin: true })
    await (Street as any).create({
      _id: testStreetId,
      address: 'Test Address',
      city: 'Test City',
    })

    const mockRequest = { method: 'DELETE', query: { id: testStreetId } } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      data: `Street ${testStreetId} was deleted`,
    })
  })

  it('should return 400 if street to delete is not found', async () => {
    const nonExistentStreetId = '649324b7ff4981c7363ceb99'
    ;(getCurrentUser as any).mockResolvedValueOnce({ isGlobalAdmin: true })

    const mockRequest = {
      method: 'DELETE',
      query: { id: nonExistentStreetId },
    } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      data: `Street ${nonExistentStreetId} was not found`,
    })
  })

  it('should return 400 if an error occurs during deletion', async () => {
    const testStreetId = '649324b7ff4981c7363ceb31'
    ;(getCurrentUser as any).mockResolvedValueOnce({ isGlobalAdmin: true })
    await (Street as any).create({
      _id: testStreetId,
      address: 'Test Address',
      city: 'Test City',
    })

    const mockRequest = { method: 'DELETE', query: { id: testStreetId } } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    jest.spyOn(Street, 'findByIdAndRemove').mockImplementationOnce(() => {
      throw new Error('Deletion error')
    })

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: expect.any(Error),
    })
  })

  it('should return 400 if user is not authorized to delete streets', async () => {
    const testStreetId = '649324b7ff4981c7363ceb31'
    ;(getCurrentUser as any).mockResolvedValueOnce({ isGlobalAdmin: false })

    const mockRequest = { method: 'DELETE', query: { id: testStreetId } } as any
    const mockResponse = {
      status: jest.fn(() => mockResponse),
      json: jest.fn(),
    } as any

    await handler(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'not allowed',
    })
  })
})
