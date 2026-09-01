import type { NextApiRequest, NextApiResponse } from 'next'
import { withErrorHandler } from '@utils/api-handler'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))

type MockRes = {
  status: jest.Mock
  json: jest.Mock
  writableEnded: boolean
}

const createRes = (writableEnded = false): MockRes => {
  const res = {
    writableEnded,
    status: jest.fn(),
    json: jest.fn(),
  } as MockRes
  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  return res
}

describe('withErrorHandler', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('calls the wrapped handler with req and res when nothing throws', async () => {
    const handler = jest.fn().mockResolvedValue(undefined)
    const req = {} as NextApiRequest
    const res = createRes()

    await withErrorHandler(handler)(req, res as unknown as NextApiResponse)

    expect(handler).toHaveBeenCalledWith(req, res)
    expect(res.status).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('responds 500 with the error message when the handler throws an Error', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('boom'))
    const res = createRes()

    await withErrorHandler(handler)(
      {} as NextApiRequest,
      res as unknown as NextApiResponse
    )

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'boom' })
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('falls back to a generic message for non-Error throwables', async () => {
    const handler = jest.fn().mockRejectedValue('just a string')
    const res = createRes()

    await withErrorHandler(handler)(
      {} as NextApiRequest,
      res as unknown as NextApiResponse
    )

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
    })
  })

  it('does not write a response if one was already sent (writableEnded)', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('late'))
    const res = createRes(true)

    await withErrorHandler(handler)(
      {} as NextApiRequest,
      res as unknown as NextApiResponse
    )

    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})
