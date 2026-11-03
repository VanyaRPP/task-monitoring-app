import handler from '@pages/api/debtors/index'
import { mockLoginAs } from '@utils/mockLoginAs'
import { users, domains } from '@utils/testData'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { expect } from '@jest/globals'
import { Roles } from '@utils/constants'
import { getCurrentUser } from '@utils/getCurrentUser'
import Payment from '@modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import { calculateDebtorsInflation } from '@utils/debt-calculation/debtors-inflation'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@modules/models/Payment')
jest.mock('@modules/models/RealEstate')
jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))
jest.mock('@utils/debt-calculation/debtors-inflation', () => ({
  calculateDebtorsInflation: jest.fn(),
}))

setupTestEnvironment()

const realDomainId = domains[0]._id

describe('Debtors API - Debt Calculation Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(calculateDebtorsInflation as jest.Mock).mockResolvedValue({})
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      isUser: false,
      isDomainAdmin: false,
      isGlobalAdmin: true,
      isAdmin: false,
      user: {
        email: users.globalAdmin.email,
        roles: [Roles.GLOBAL_ADMIN],
      },
    })
  })

  it('should correctly calculate totalDebt when debit > credit', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        _id: 'payment1',
        company: 'company1',
        type: 'debit',
        generalSum: 1000,
        monthService: 'service1',
      },
      {
        _id: 'payment2',
        company: 'company1',
        type: 'credit',
        generalSum: 300,
        monthService: 'service1',
      },
    ])
    ;(RealEstate.find as jest.Mock).mockResolvedValue([
      {
        _id: 'company1',
        companyName: 'Test Company',
        domain: realDomainId,
      },
    ])

    const mockReq = {
      method: 'GET',
      query: { domainIds: [realDomainId] },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        companies: expect.arrayContaining([
          expect.objectContaining({
            companyId: 'company1',
            companyName: 'Test Company',
            totalDebt: 700,
          }),
        ]),
      })
    )
  })

  it('should not include company when debit = credit (totalDebt = 0)', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        _id: 'payment1',
        company: 'company1',
        type: 'debit',
        generalSum: 500,
        monthService: 'service1',
      },
      {
        _id: 'payment2',
        company: 'company1',
        type: 'credit',
        generalSum: 500,
        monthService: 'service1',
      },
    ])
    ;(RealEstate.find as jest.Mock).mockResolvedValue([
      {
        _id: 'company1',
        companyName: 'Test Company',
        domain: realDomainId,
      },
    ])

    const mockReq = {
      method: 'GET',
      query: { domainIds: [realDomainId] },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        companies: [],
      })
    )
  })

  it('should include company with a negative totalDebt when credit > debit', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        _id: 'payment1',
        company: 'company1',
        type: 'debit',
        generalSum: 200,
        monthService: 'service1',
      },
      {
        _id: 'payment2',
        company: 'company1',
        type: 'credit',
        generalSum: 500,
        monthService: 'service1',
      },
    ])
    ;(RealEstate.find as jest.Mock).mockResolvedValue([
      {
        _id: 'company1',
        companyName: 'Test Company',
        domain: realDomainId,
      },
    ])

    const mockReq = {
      method: 'GET',
      query: { domainIds: [realDomainId] },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        companies: expect.arrayContaining([
          expect.objectContaining({
            companyId: 'company1',
            companyName: 'Test Company',
            totalDebt: -300,
          }),
        ]),
      })
    )
  })

  it('should correctly sum debits and credits across multiple monthServices', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        _id: 'payment1',
        company: 'company1',
        type: 'debit',
        generalSum: 1000,
        monthService: 'service1',
      },
      {
        _id: 'payment2',
        company: 'company1',
        type: 'credit',
        generalSum: 300,
        monthService: 'service1',
      },
      {
        _id: 'payment3',
        company: 'company1',
        type: 'debit',
        generalSum: 500,
        monthService: 'service2',
      },
      {
        _id: 'payment4',
        company: 'company1',
        type: 'credit',
        generalSum: 100,
        monthService: 'service2',
      },
    ])
    ;(RealEstate.find as jest.Mock).mockResolvedValue([
      {
        _id: 'company1',
        companyName: 'Test Company',
        domain: realDomainId,
      },
    ])

    const mockReq = {
      method: 'GET',
      query: { domainIds: [realDomainId] },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        companies: expect.arrayContaining([
          expect.objectContaining({
            companyId: 'company1',
            companyName: 'Test Company',
            totalDebt: 1100,
          }),
        ]),
      })
    )
  })

  it('should handle multiple companies with debt in both directions', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        _id: 'payment1',
        company: 'company1',
        type: 'debit',
        generalSum: 1000,
        monthService: 'service1',
      },
      {
        _id: 'payment2',
        company: 'company1',
        type: 'credit',
        generalSum: 200,
        monthService: 'service1',
      },
      {
        _id: 'payment3',
        company: 'company2',
        type: 'debit',
        generalSum: 600,
        monthService: 'service1',
      },
      {
        _id: 'payment4',
        company: 'company2',
        type: 'credit',
        generalSum: 100,
        monthService: 'service1',
      },
      {
        _id: 'payment5',
        company: 'company3',
        type: 'debit',
        generalSum: 300,
        monthService: 'service1',
      },
      {
        _id: 'payment6',
        company: 'company3',
        type: 'credit',
        generalSum: 400,
        monthService: 'service1',
      },
    ])
    ;(RealEstate.find as jest.Mock).mockResolvedValue([
      {
        _id: 'company1',
        companyName: 'Company One',
        domain: realDomainId,
      },
      {
        _id: 'company2',
        companyName: 'Company Two',
        domain: realDomainId,
      },
      {
        _id: 'company3',
        companyName: 'Company Three',
        domain: realDomainId,
      },
    ])

    const mockReq = {
      method: 'GET',
      query: { domainIds: [realDomainId] },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        companies: expect.arrayContaining([
          expect.objectContaining({
            companyId: 'company1',
            companyName: 'Company One',
            totalDebt: 800,
          }),
          expect.objectContaining({
            companyId: 'company2',
            companyName: 'Company Two',
            totalDebt: 500,
          }),
          expect.objectContaining({
            companyId: 'company3',
            companyName: 'Company Three',
            totalDebt: -100, // 300 - 400, the domain owes the company
          }),
        ]),
      })
    )
  })

  it('should handle company with only debit payments', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        _id: 'payment1',
        company: 'company1',
        type: 'debit',
        generalSum: 1000,
        monthService: 'service1',
      },
      {
        _id: 'payment2',
        company: 'company1',
        type: 'debit',
        generalSum: 500,
        monthService: 'service2',
      },
    ])
    ;(RealEstate.find as jest.Mock).mockResolvedValue([
      {
        _id: 'company1',
        companyName: 'Test Company',
        domain: realDomainId,
      },
    ])

    const mockReq = {
      method: 'GET',
      query: { domainIds: [realDomainId] },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        companies: expect.arrayContaining([
          expect.objectContaining({
            companyId: 'company1',
            companyName: 'Test Company',
            totalDebt: 1500, // 1500 - 0
          }),
        ]),
      })
    )
  })

  it('should handle company with only credit payments as a fully negative debt', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        _id: 'payment1',
        company: 'company1',
        type: 'credit',
        generalSum: 1000,
        monthService: 'service1',
      },
      {
        _id: 'payment2',
        company: 'company1',
        type: 'credit',
        generalSum: 500,
        monthService: 'service2',
      },
    ])
    ;(RealEstate.find as jest.Mock).mockResolvedValue([
      {
        _id: 'company1',
        companyName: 'Test Company',
        domain: realDomainId,
      },
    ])

    const mockReq = {
      method: 'GET',
      query: { domainIds: [realDomainId] },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        companies: expect.arrayContaining([
          expect.objectContaining({
            companyId: 'company1',
            companyName: 'Test Company',
            totalDebt: -1500, // 0 - 1500
          }),
        ]),
      })
    )
  })

  it('should keep fractional negative debts with two-decimal precision', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        _id: 'payment1',
        company: 'company1',
        type: 'debit',
        generalSum: 100.1,
        monthService: 'service1',
      },
      {
        _id: 'payment2',
        company: 'company1',
        type: 'credit',
        generalSum: 100.35,
        monthService: 'service1',
      },
    ])
    ;(RealEstate.find as jest.Mock).mockResolvedValue([
      {
        _id: 'company1',
        companyName: 'Test Company',
        domain: realDomainId,
      },
    ])

    const mockReq = {
      method: 'GET',
      query: { domainIds: [realDomainId] },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        companies: expect.arrayContaining([
          expect.objectContaining({
            companyId: 'company1',
            totalDebt: -0.25,
          }),
        ]),
      })
    )
  })

  it('should exclude a settled company while keeping both debt directions', async () => {
    await mockLoginAs(users.globalAdmin)
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        _id: 'payment1',
        company: 'company1',
        type: 'debit',
        generalSum: 700,
        monthService: 'service1',
      },
      {
        _id: 'payment2',
        company: 'company2',
        type: 'credit',
        generalSum: 250,
        monthService: 'service1',
      },
      {
        _id: 'payment3',
        company: 'company3',
        type: 'debit',
        generalSum: 400,
        monthService: 'service1',
      },
      {
        _id: 'payment4',
        company: 'company3',
        type: 'credit',
        generalSum: 400,
        monthService: 'service1',
      },
    ])
    ;(RealEstate.find as jest.Mock).mockResolvedValue([
      { _id: 'company1', companyName: 'Debtor', domain: realDomainId },
      { _id: 'company2', companyName: 'Overpaid', domain: realDomainId },
      { _id: 'company3', companyName: 'Settled', domain: realDomainId },
    ])

    const mockReq = {
      method: 'GET',
      query: { domainIds: [realDomainId] },
    } as any

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        companies: [
          expect.objectContaining({ companyId: 'company1', totalDebt: 700 }),
          expect.objectContaining({ companyId: 'company2', totalDebt: -250 }),
        ],
      })
    )
  })

  describe('інфляційні втрати', () => {
    const run = async () => {
      ;(Payment.find as jest.Mock).mockResolvedValue([
        {
          _id: 'payment1',
          company: 'company1',
          type: 'debit',
          generalSum: 1500,
          monthService: 'service1',
        },
      ])
      ;(RealEstate.find as jest.Mock).mockResolvedValue([
        { _id: 'company1', companyName: 'Test Company', domain: realDomainId },
      ])
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any
      await handler(
        { method: 'GET', query: { domainIds: [realDomainId] } } as any,
        res
      )
      return res
    }

    it('додає до боржника інфляційні втрати з двигуна', async () => {
      const inflation = {
        loss: 34.68,
        from: '2025-01',
        to: '2025-03',
        method: 'balance',
      }
      ;(calculateDebtorsInflation as jest.Mock).mockResolvedValue({
        company1: inflation,
      })

      const res = await run()

      expect(calculateDebtorsInflation).toHaveBeenCalledWith(['company1'])
      expect(res.json.mock.calls[0][0].companies).toEqual([
        expect.objectContaining({ companyId: 'company1', inflation }),
      ])
    })

    it('збій розрахунку інфляції не ламає бейдж боргу', async () => {
      ;(calculateDebtorsInflation as jest.Mock).mockRejectedValue(
        new Error('boom')
      )
      const error = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const res = await run()

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json.mock.calls[0][0].companies).toEqual([
        expect.objectContaining({ totalDebt: 1500, inflation: null }),
      ])
      error.mockRestore()
    })
  })
})
