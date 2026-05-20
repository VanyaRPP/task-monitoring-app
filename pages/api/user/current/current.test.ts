import { expect } from '@jest/globals'
import handler from '@pages/api/user/current'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { users } from '@utils/testData'

jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

describe('GET /api/user/current', () => {
  let req: any
  let res: any

  beforeEach(() => {
    req = { method: 'GET' }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  })

  it('Should return GlobalAdmin', async () => {
    await mockLoginAs(users.globalAdmin)

    const req = { method: 'GET' } as any
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining(users.globalAdmin),
    })
  })

  it('Should return DomainAdmin', async () => {
    await mockLoginAs(users.domainAdmin)

    const req = { method: 'GET' } as any
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining(users.domainAdmin),
    })
  })

  it('Should return error if user not exists', async () => {
    await mockLoginAs({ email: 'not_exist@example.com', roles: [] })

    const req = { method: 'GET' } as any
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false })
  })
})
