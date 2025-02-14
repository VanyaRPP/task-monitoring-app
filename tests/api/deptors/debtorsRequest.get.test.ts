import handler from '@pages/api/debtors/index';
import { mockLoginAs } from '@utils/mockLoginAs';
import {
  users,
  domains
} from '@utils/testData';
import { setupTestEnvironment } from '@utils/setupTestEnvironment';
import { expect } from '@jest/globals';


jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }));
jest.mock('@pages/api/api.config', () => jest.fn());
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('@modules/models/Payment');
jest.mock('@modules/models/RealEstate');

setupTestEnvironment();

let realDomainId = domains[0]._id;
let realDomainIdArray = [domains[0]._id, domains[1]._id];


describe('Deptors API - GET', () => {
  it('should NOT load when domainId = 0', async () => {
    await mockLoginAs(users.user);
    console.log(await mockLoginAs(users.user))
    
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

  it('should load when domainId = realDomainId', async () => {
    await mockLoginAs(users.domainAdmin);
    
    const mockReq = { method: 'GET', query: { domainId: realDomainId } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  
  });

  it('should load when domainId = realDomainIdArray', async () => {
    await mockLoginAs(users.domainAdmin);
    
    const mockReq = { method: 'GET', query: { domainId: realDomainIdArray } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  
  });

  it('should NOT load when domainId = realDomainId as User', async () => {
    await mockLoginAs(users.user);
    const mockReq = { method: 'GET', query: { domainId: realDomainId } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should load when domainId = realDomainId as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const mockReq = { method: 'GET', query: { domainId: realDomainId } } as any
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any

    await handler(mockReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
   
  })

  it('should load when domainId = realDomainId as GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin);
    const mockReq = { method: 'GET', query: { domainId: realDomainId } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
   
  });

  it('should NOT load when domainId = realDomainIdArray as User', async () => {
    await mockLoginAs(users.user);
    
    const mockReq = { method: 'GET', query: { domainId: realDomainIdArray } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should load when domainId = realDomainIdArray as DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin);
    const mockReq = { method: 'GET', query: { domainId: realDomainIdArray } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
   
  });

  it('should load when domainId = realDomainIdArray as GlobalAdmin', async () => {
    await mockLoginAs(users.domainAdmin);
    const mockReq = { method: 'GET', query: { domainId: realDomainIdArray } } as any;
    const mockRes = { status: jest.fn(() => mockRes), json: jest.fn() } as any;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
   
  });
});
