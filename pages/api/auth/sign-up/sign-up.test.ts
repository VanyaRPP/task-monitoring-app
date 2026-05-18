import { expect } from '@jest/globals'
import handler from '@pages/api/auth/sign-up'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import User from '@modules/models/User'
import bcrypt from 'bcrypt'

jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('@modules/models/User')
jest.mock('bcrypt')

setupTestEnvironment()

describe('POST /api/auth/sign-up', () => {
  const req = {
    method: 'POST',
    body: {
      name: 'Test User',
      email: 'test@test.com',
      password: '123456',
    },
  } as any

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as any

  beforeEach(() => {
    jest.clearAllMocks()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Should create new user', async () => {
    ;(User.findOne as jest.Mock).mockResolvedValue(null)
    ;(bcrypt.hash as jest.Mock).mockImplementation((_p, _s, cb) =>
      cb(null, 'hashed-password')
    )
    ;(User.create as jest.Mock).mockResolvedValue({})

    await handler(req, res)

    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@test.com' })
    expect(User.create).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@test.com',
      password: 'hashed-password',
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })

  it('Should return 409 if user already exists', async () => {
    ;(User.findOne as jest.Mock).mockResolvedValue({ email: 'test@test.com' })

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'User already exists!',
    })
  })

  it('Should return 400 on error', async () => {
    ;(User.findOne as jest.Mock).mockRejectedValue(new Error('database error'))

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: expect.anything(),
    })
  })
})
