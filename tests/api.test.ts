import { NextApiRequest, NextApiResponse } from 'next'
import handler from 'path/to/your/api/handler'

// Mock the required dependencies
jest.mock('common/modules/models/Domain', () => ({
  find: jest.fn().mockResolvedValue([]),
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({ isAdmin: true }),
}))

describe('API Handler', () => {
  let req: NextApiRequest
  let res: NextApiResponse<any>

  beforeEach(() => {
    req = {} as NextApiRequest
    res = {} as NextApiResponse<any>
    res.status = jest.fn().mockReturnThis()
    res.json = jest.fn().mockReturnThis()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return all domains on GET request without limit', async () => {
    await handler({ ...req, method: 'GET' }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [] })
  })

  it('should return domains with limit on GET request', async () => {
    const domainMock = [{ name: 'Domain 1' }, { name: 'Domain 2' }]
    const findMock = jest.fn().mockResolvedValue(domainMock)
    jest
      .spyOn(require('common/modules/models/Domain'), 'find')
      .mockImplementation(findMock)

    await handler({ ...req, method: 'GET', query: { limit: '2' } }, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, data: domainMock })
    expect(findMock).toHaveBeenCalledWith({}).limit(2)
  })
})
