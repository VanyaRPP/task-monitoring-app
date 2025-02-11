import handler from '@pages/api/debtors/index';
import Payment from '@modules/models/Payment';
import RealEstate from '@modules/models/RealEstate';
import { mockLoginAs } from '@utils/mockLoginAs';
import {
  users,
  paymentsCredit,
  realEstates,
} from '@utils/testData';
import { setupTestEnvironment } from '@utils/setupTestEnvironment';
import { expect } from '@jest/globals';

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }));
jest.mock('@pages/api/api.config', () => jest.fn());

jest.mock('@modules/models/Payment');
jest.mock('@modules/models/RealEstate');

setupTestEnvironment();

describe('Deptors API - GET', () => {
  it('should NOT load when domainId = 0', async () => {
    await mockLoginAs(users.user);
    
    const mockReq = { method: 'GET', query: { domainId: 0 } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should NOT load when domainId = ""', async () => {
    await mockLoginAs(users.user);
    
    const mockReq = { method: 'GET', query: { domainId: "" } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should NOT load when domainId is undefined', async () => {
    await mockLoginAs(users.user);
    
    const mockReq = { method: 'GET', query: { domainId: undefined } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should NOT load when domainId is null', async () => {
    await mockLoginAs(users.user);
    
    const mockReq = { method: 'GET', query: { domainId: null } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should load when domainId = "id"', async () => {
    await mockLoginAs(users.domainAdmin);
    
    (Payment.find as jest.Mock).mockResolvedValue(paymentsCredit);
    (RealEstate.find as jest.Mock).mockResolvedValue(realEstates);
    
    const mockReq = { method: 'GET', query: { domainId: "id" } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should load when domainId = ["id", "id"]', async () => {
    await mockLoginAs(users.domainAdmin);
    
    (Payment.find as jest.Mock).mockResolvedValue(paymentsCredit);
    (RealEstate.find as jest.Mock).mockResolvedValue(realEstates);
    
    const mockReq = { method: 'GET', query: { domainId: ["id", "id"] } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should load when domainId = "id" as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin);
    
    (Payment.find as jest.Mock).mockResolvedValue(paymentsCredit);
    (RealEstate.find as jest.Mock).mockResolvedValue(realEstates);
    
    const mockReq = { method: 'GET', query: { domainId: "id" } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should NOT load when domainId = ["id", "id"] as User', async () => {
    await mockLoginAs(users.user);
    
    const mockReq = { method: 'GET', query: { domainId: ["id", "id"] } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should load when domainId = ["id", "id"] as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin);
    
    (Payment.find as jest.Mock).mockResolvedValue(paymentsCredit);
    (RealEstate.find as jest.Mock).mockResolvedValue(realEstates);
    
    const mockReq = { method: 'GET', query: { domainId: ["id", "id"] } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should load when domainId = ["id", "id"] as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin);
    
    (Payment.find as jest.Mock).mockResolvedValue(paymentsCredit);
    (RealEstate.find as jest.Mock).mockResolvedValue(realEstates);
    
    const mockReq = { method: 'GET', query: { domainId: ["id", "id"] } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });
});
