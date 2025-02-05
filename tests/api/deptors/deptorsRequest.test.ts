import handler from '@pages/api/debtors/index'
import Payment from '@modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import { mockLoginAs } from '@utils/mockLoginAs'
import {
  users,
  paymentsCredit,
  realEstates,
  domains,
  services,
} from '@utils/testData'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { expect } from '@jest/globals'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

jest.mock('@modules/models/Payment')
jest.mock('@modules/models/RealEstate')

setupTestEnvironment()

describe('Deptors API - GET', () => {
  it('should return companies with payments for the given domainId', async () => {
    await mockLoginAs(users.globalAdmin)
    // Мокаємо методи моделей
    const mockDomainId = domains[0]._id

    ;(Payment.find as jest.Mock).mockResolvedValue(paymentsCredit)
    ;(RealEstate.find as jest.Mock).mockResolvedValue(realEstates)

    const mockReq = {
      method: 'GET',
      query: { domainId: mockDomainId },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].companies,
    }

    expect(response.status).toHaveBeenCalledWith(200)

    const expectedResponse = [
      {
        companyId: '64d68421d9ba2fc8fea79d21',
        companyName: 'company_0',
        debtPerMonth: [
          {
            monthService: services[0]._id,
            totalDue: 0,
            paid: -1000,
            remaining: 1000,
          },
        ],
        totalDebt: 1000,
      },
    ]

    expect(response.data).toEqual(expectedResponse)
  })

  it('should return empty companies array if no payments found', async () => {
    const mockDomainId = 'mockDomainId'

    ;(Payment.find as jest.Mock).mockResolvedValue([])
    ;(RealEstate.find as jest.Mock).mockResolvedValue([])

    const mockReq = {
      method: 'GET',
      query: { domainId: mockDomainId },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    const response = {
      status: mockRes.status,
      data: mockRes.json.mock.lastCall[0].companies,
    }

    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.data).toEqual([])
  })

  it('should return status 500 if an error occurs', async () => {
    ;(Payment.find as jest.Mock).mockRejectedValue(new Error('Database error'))
    ;(RealEstate.find as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const mockReq = {
      method: 'GET',
      query: { domainId: 'mockDomainId' },
    } as any

    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(500)
  })
})
