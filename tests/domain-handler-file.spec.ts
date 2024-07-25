import Domain from '@modules/models/Domain'
import { getCurrentUser } from '@utils/getCurrentUser'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { isGlobalAdmin } = getCurrentUser(req)

  await handler(req, res)

  expect(res.status).toHaveBeenCalledWith(400)
  expect(res.json).toHaveBeenCalledWith({
    success: false,
    error: error,
  })
}

describe('POST request', () => {
  beforeEach(() => {
    req.method = 'POST'
    mocked(Domain.create).mockReset()
  })

  test('should create domain', async () => {
    mocked(getCurrentUser).mockResolvedValueOnce({ isGlobalAdmin: true })

    const createdDomain = {
      _id: '1',
      name: 'New Domain',
    }
    mocked(Domain.create).mockResolvedValueOnce(createdDomain)

    req.body = { name: 'New Domain' }
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: createdDomain,
    })
  })

  test('should return error if not admin', async () => {
    mocked(getCurrentUser).mockResolvedValueOnce({ isGlobalAdmin: false })

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'not allowed',
    })
  })

  test('should return error if create throws an error', async () => {
    mocked(getCurrentUser).mockResolvedValueOnce({ isGlobalAdmin: true })

    const error = new Error('Database error')
    mocked(Domain.create).mockRejectedValueOnce(error)

    req.body = { name: 'New Domain' }
    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: error,
    })
  })
})
