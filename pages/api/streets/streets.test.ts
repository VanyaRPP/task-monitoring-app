import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { getCurrentUser } from '@utils/getCurrentUser'
import Domain from '@common/modules/models/Domain'
import Street from '@common/modules/models/Street'
import handler from './index'

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
})

const testStreetsData = [
  {
    _id: '649324b7ff4981c7363ceb31',
    address: 'Хлібна 25',
    city: 'Житомир',
  },
  {
    _id: '649324c0ff4981c7363ceb34',
    address: 'Мала Бердичівська 17 Б',
    city: 'Житомир',
  },
  {
    _id: '64ae9066671f79da860b5d5b',
    address: 'небесна сотня 24Г',
    city: 'Житомир',
  },
]

const testDomainsData = [
  {
    _id: '6493263bff4981c7363ceb5b',
    streets: ['649324c0ff4981c7363ceb34', '649324b7ff4981c7363ceb31'],
    name: 'domain1',
    address: 'address1',
    description: 'Опис1',
    bankInformation: 'ТОВ1',
    phone: '0634999999',
    email: 'domain1@gmail.com',
  },
  {
    _id: '6494665488f76005bc1f7984',
    streets: ['64ae9066671f79da860b5d5b'],
    name: 'domain2',
    address: 'address2',
    description: 'Опис2',
    bankInformation: 'ТОВ2',
    phone: '0634999998',
    email: 'domain2@gmail.com',
  },
]
