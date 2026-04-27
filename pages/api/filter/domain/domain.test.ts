import handler from './index'
import { getDistinctCompanyAndDomain } from '@utils/helpers'

jest.mock('@utils/helpers', () => ({
  getDistinctCompanyAndDomain: jest.fn(),
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: () => Promise.resolve({ isGlobalAdmin: true, user: { _id: '1' } }),
}))

jest.mock('@pages/api/api.config', () => jest.fn())

describe('API Filter Domains Handler (Manual Mocks)', () => {
  it('має повертати відфільтровані домени на основі переданих вулиць', async () => {
    const mockDomains = [
      { domainDetails: { name: 'Водоканал', _id: 'dom_1' } }
    ];
    (getDistinctCompanyAndDomain as jest.Mock).mockResolvedValue({
      distinctDomains: mockDomains
    })

    const req = {
      method: 'GET',
      query: {
        streets: '65f1234567890abcdef12345',
      },
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    await handler(req as any, res as any)

    expect(res.status).toHaveBeenCalledWith(200)
    
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        domainsFilter: expect.arrayContaining([
          { text: 'Водоканал', value: 'dom_1' }
        ])
      })
    )

    expect(getDistinctCompanyAndDomain).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          filteredStreets: [expect.any(Object)],
        })
      })
    )
  })

  it('має повертати помилку 405 для не-GET запитів', async () => {
    const req = { method: 'POST' }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    await handler(req as any, res as any)

    expect(res.status).toHaveBeenCalledWith(405)
  })
})