import handler from '@pages/api/debtors/index'
import { mockLoginAs } from '@utils/mockLoginAs'
import { users, domains } from '@utils/testData'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { expect } from '@jest/globals'
import { Roles } from '@utils/constants'
import { getCurrentUser } from '@utils/getCurrentUser'
import Payment from '@modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@modules/models/Payment')
jest.mock('@modules/models/RealEstate')
jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

setupTestEnvironment()

const realDomainId = domains[0]._id
const realDomainIdArray = [domains[0]._id, domains[1]._id]

describe('Deptors API - GET', () => {
  it('should NOT load when domainId = 0', async () => {
    await mockLoginAs(users.user)

    const mockReq = { method: 'GET', query: { domainIds: 0 } } as any
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any

    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.any(String),
      })
    )
  })

  it('should NOT load when domainId = ""', async () => {
    await mockLoginAs(users.user)

    const mockReq = { method: 'GET', query: { domainIds: '' } } as any
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any

    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it('should NOT load when domainId is undefined', async () => {
    await mockLoginAs(users.user)

    const mockReq = { method: 'GET', query: { domainId: undefined } } as any
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any

    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it('should NOT load when domainId is null', async () => {
    await mockLoginAs(users.user)

    const mockReq = { method: 'GET', query: { domainIds: null } } as any
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any

    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(500)
  })

  it('should load when domainId = realDomainId', async () => {
    await mockLoginAs(users.domainAdmin2);
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      isUser: false,
      isDomainAdmin: true,
      isGlobalAdmin: false,
      isAdmin: false,
      user: {
        email: users.domainAdmin2.email,
        roles: [Roles.DOMAIN_ADMIN],
      },
    });
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        _id: 'payment1',
        company: 'company1',
        type: 'debit',
        generalSum: 100,
        monthService: 'service1',
      },
      {
        _id: 'payment2',
        company: 'company1',
        type: 'credit',
        generalSum: 50,
        monthService: 'service1',
      },
    ]);
    ;(RealEstate.find as jest.Mock).mockResolvedValue([
      {
        _id: 'company1',
        companyName: 'Test Company',
        domain: realDomainId,
      },
    ]);
    const mockReq = {
      method: 'GET',
      query: { domainIds: [realDomainId] },
    } as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        companies: expect.arrayContaining([
          expect.objectContaining({
            companyId: 'company1',
            companyName: 'Test Company',
            totalDebt: 50,
          }),
        ]),
      })
    );
  });

  it('should load when domainId = realDomainIdArray', async () => {
    await mockLoginAs(users.domainAdmin);
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      isUser: false,
      isDomainAdmin: true,
      isGlobalAdmin: false,
      isAdmin: false,
      user: {
        email: users.domainAdmin.email,
        roles: [Roles.DOMAIN_ADMIN],
      },
    });
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        _id: 'payment1',
        company: 'company1',
        type: 'debit',
        generalSum: 100,
        monthService: 'service1',
      },
      {
        _id: 'payment2',
        company: 'company1',
        type: 'credit',
        generalSum: 50,
        monthService: 'service1',
      },
    ]);
    ;(RealEstate.find as jest.Mock).mockResolvedValue([
      {
        _id: 'company1',
        companyName: 'Test Company',
        domain: realDomainIdArray[0],
      },
    ]);
    const mockReq = {
      method: 'GET',
      query: { domainIds: realDomainIdArray },
    } as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        companies: expect.arrayContaining([
          expect.objectContaining({
            companyId: 'company1',
            companyName: 'Test Company',
            totalDebt: 50,
          }),
        ]),
      })
    );
  });

  it('should NOT load when domainId = realDomainId as User', async () => {
    await mockLoginAs(users.user);
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      isUser: true,
      isDomainAdmin: false,
      isGlobalAdmin: false,
      isAdmin: false,
      user: {
        email: users.user.email,
        roles: [Roles.USER],
      },
    });
    const mockReq = {
      method: 'GET',
      query: { domainIds: [realDomainId] },
    } as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Unauthorized',
      })
    );
  });

  it('should load when domainId = realDomainId as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin2);
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isUser: false,
      isDomainAdmin: true,
      isGlobalAdmin: false,
      isAdmin: false,
      user: {
        email: users.domainAdmin2.email,
        roles: [Roles.DOMAIN_ADMIN],
      },
    })
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        _id: 'payment1',
        company: 'company1',
        type: 'debit',
        generalSum: 100,
        monthService: 'service1',
      },
      {
        _id: 'payment2',
        company: 'company1',
        type: 'credit',
        generalSum: 50,
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
            totalDebt: 50,
          }),
        ]),
      })
    )
  })

  it('should load when domainId = realDomainId as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin);
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      isUser: false,
      isDomainAdmin: false,
      isGlobalAdmin: true,
      isAdmin: false,
      user: {
        email: users.globalAdmin.email,
        roles: [Roles.GLOBAL_ADMIN],
      },
    });
    ;(Payment.find as jest.Mock).mockResolvedValue([
      {
        _id: 'payment1',
        company: 'company1',
        type: 'debit',
        generalSum: 100,
        monthService: 'service1',
      },
      {
        _id: 'payment2',
        company: 'company1',
        type: 'credit',
        generalSum: 50,
        monthService: 'service1',
      },
    ]);
    ;(RealEstate.find as jest.Mock).mockResolvedValue([
      {
        _id: 'company1',
        companyName: 'Test Company',
        domain: realDomainId,
      },
    ]);
    const mockReq = {
      method: 'GET',
      query: { domainIds: [realDomainId] },
    } as any;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        companies: expect.arrayContaining([
          expect.objectContaining({
            companyId: 'company1',
            companyName: 'Test Company',
            totalDebt: 50,
          }),
        ]),
      })
    );
  });

  it('should NOT load when domainId = realDomainIdArray as User', async () => {
    await mockLoginAs(users.user)
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      isUser: true,
      isDomainAdmin: false,
      isGlobalAdmin: false,
      isAdmin: false,
      user: {
        email: users.user.email,
        roles: [Roles.USER],
      },
    })
    const mockReq = {
      method: 'GET',
      query: { domainIds: realDomainIdArray }, 
    } as any
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any
    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Unauthorized',
      })
    )
  })

  it('should load when domainId = realDomainIdArray as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin2);
    (getCurrentUser as jest.Mock).mockResolvedValue({
      isUser: false,
      isDomainAdmin: true,
      isGlobalAdmin: false,
      isAdmin: false,
      user: {
        email: users.domainAdmin2.email,
        roles: [Roles.DOMAIN_ADMIN],
      },
    })
    const mockReq = {
      method: 'GET',
      query: { domainIds: realDomainIdArray },
    } as any
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any
    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })

  it('should load when domainId = realDomainIdArray as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)
    const mockReq = {
      method: 'GET',
      query: { domainIds: realDomainIdArray },
    } as any
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any
    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
  })
})
