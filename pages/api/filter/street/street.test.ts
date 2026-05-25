import handler from './index'
import * as helpers from '@utils/helpers'
import mongoose from 'mongoose'

jest.mock('@utils/helpers', () => ({
  __esModule: true,
  getDistinctStreets: jest.fn(),
  getFilterForAddress: jest.fn(),
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    isGlobalAdmin: true,
    user: { _id: '65f1234567890abcdef12345' },
  }),
}))

jest.mock('@pages/api/api.config', () => jest.fn())

describe('API Filter Street Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('має повертати відфільтровані вулиці на основі переданих доменів та компаній', async () => {
    const mockStreetId = new mongoose.Types.ObjectId()

    ;(helpers.getDistinctStreets as jest.Mock).mockResolvedValue([
      {
        streetData: {
          _id: mockStreetId,
          address: 'вул. Тестова, 1',
          city: 'Київ',
        },
      },
    ])

    const domainId = new mongoose.Types.ObjectId().toString()
    const companyId = new mongoose.Types.ObjectId().toString()

    const req = {
      method: 'GET',
      query: {
        domains: domainId,
        realEstates: companyId,
      },
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    await handler(req as any, res as any)

    expect(helpers.getDistinctStreets).toHaveBeenCalledTimes(1)

    expect(helpers.getDistinctStreets).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: {
          filteredDomains: [expect.any(mongoose.Types.ObjectId)],
          filteredCompanys: [expect.any(mongoose.Types.ObjectId)],
        },
      })
    )

    expect(res.status).toHaveBeenCalledWith(200)
    const data = res.json.mock.calls[0][0]
    expect(data.success).toBe(true)
    expect(data.streetsFilter[0].value).toBe(mockStreetId)
  })
})
