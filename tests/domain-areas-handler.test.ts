import { expect } from '@jest/globals'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import handler from '@pages/api/domain/areas/[id]'
import { users } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('GetCompanyAreas', () => {
  it('GlobalAdmin can receive companies with areas -  success', async () => {
    await mockLoginAs(users.globalAdmin)
    const mockReq = {
      method: 'GET',
      query: { id: '64d68421d9ba2fc8fea79d14' },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)
    const responseData = await mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(responseData.data).toMatchObject({
      companies: [
        { companyName: 'company_3', totalArea: 10, rentPart: 45 },
        { companyName: 'company_5', totalArea: 10, rentPart: 50 }
      ],
      totalArea: 20
    })
  })

  it('GlobalAdmin cant receive any companies', async () => {
    // Поверне помилку тому що queri.id не має компаній
    await mockLoginAs(users.globalAdmin)
    const mockReq = {
      method: 'GET',
      query: { id: '64e725c7a62fdf2d22b84c4a' },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)
    const responseData = await mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(responseData.message).toBe('There are no companies yet')
  })
  it('DomainAdmin can receive companies with areas -  success', async () => {
    await mockLoginAs(users.domainAdmin)
    const mockReq = {
      method: 'GET',
      query: { id: '64d68421d9ba2fc8fea79d11' },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)
    const responseData = await mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(responseData.data).toMatchObject({
      companies: [
        { companyName: 'company_0', totalArea: 10, rentPart: 25 },
        { companyName: 'company_5', totalArea: 10, rentPart: 0 }
      ],
      totalArea: 20
    })
  })
  it('DomainAdmin cant receive companies from other domain', async () => {
    // Поверне помилку тому що queri.id від іншого Домену і він не пройде перевірку валідатору
    await mockLoginAs(users.domainAdmin)
    const mockReq = {
      method: 'GET',
      query: { id: '64d68421d9ba2fc8fea79d24' },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)
    const responseData = await mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(responseData.message).toBe(
      'You do not have the rights to connect to this Domain.'
    )
  })

  it('DomainAdmin cant receive companies because it does not have any company', async () => {
    // Поверне помилку тому що queri.id не має компаній
    await mockLoginAs(users.domainAdmin2)
    const mockReq = {
      method: 'GET',
      query: { id: '64e725c7a62fdf2d22b84c4a' },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)
    const responseData = await mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(responseData.message).toBe('There are no companies yet')
  })

  it('User can receive companies with areas -  success', async () => {
    await mockLoginAs(users.user)
    const mockReq = {
      method: 'GET',
      query: { id: '64d68421d9ba2fc8fea79d11' },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)
    const responseData = await mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(responseData.data).toMatchObject({
      companies: [
        { companyName: 'company_0', totalArea: 10, rentPart: 25 },
        { companyName: 'company_5', totalArea: 10, rentPart: 0 }
      ],
      totalArea: 20
    })
  })

  it('User cant receive companies because the entered DomainId was not found', async () => {
    await mockLoginAs(users.user2)
    const mockReq = {
      method: 'GET',
      query: { id: '64d68421d9ba2fc8fea79d11' },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)
    const responseData = await mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(responseData.message).toBe(
      'Domain not found.'
    )
  })
  it('User cant receive companies because they entered an incorrect DomainId', async () => {
    // Поверне помилку тому що queri.id від іншого домену
    await mockLoginAs(users.user)
    const mockReq = {
      method: 'GET',
      query: { id: '64d68421d9ba2fc8fea79d22' },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)
    const responseData = await mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(responseData.message).toBe(
      'You do not have the rights to connect to this Domain.'
    )
  })
  it('noRoleUser cant receive company data without having a role', async () => {
    // Поверне помилку тому що юзер без ролі
    await mockLoginAs(users.noRoleUser)
    const mockReq = {
      method: 'GET',
      query: { id: '64d68421d9ba2fc8fea79d11' },
    } as any
    const mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(),
    } as any

    await handler(mockReq, mockRes)
    const responseData = await mockRes.json.mock.calls[0][0]
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(responseData.message).toBe('You are not autorized')
  })
})