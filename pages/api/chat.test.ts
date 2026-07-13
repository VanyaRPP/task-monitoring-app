import handler from './chat'
import { getCurrentUser } from '@utils/getCurrentUser'
import { streamText } from 'ai'
import type { NextApiRequest, NextApiResponse } from 'next'

jest.mock('@utils/getCurrentUser', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@ai-sdk/google', () => ({ google: jest.fn(() => 'mock-model') }))
jest.mock('@common/services/aiAssistant/tools', () => ({
  buildAssistantTools: jest.fn(() => ({})),
}))
jest.mock('ai', () => ({
  streamText: jest.fn(),
  convertToModelMessages: jest.fn(async (m) => m),
  stepCountIs: jest.fn(() => 'stop'),
}))

const mockGetCurrentUser = getCurrentUser as jest.Mock
const mockStreamText = streamText as jest.Mock

const adminCtx = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  isAdmin: true,
  user: { email: 'admin@example.com' },
  session: {},
}

function buildRes() {
  const res: Partial<NextApiResponse> & {
    socket: { setNoDelay: jest.Mock }
  } = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    setHeader: jest.fn(),
    socket: { setNoDelay: jest.fn() } as any,
  }
  return res as unknown as NextApiResponse
}

function req(overrides: Partial<NextApiRequest> = {}) {
  return {
    method: 'POST',
    body: { messages: [{ role: 'user', parts: [] }] },
    ...overrides,
  } as NextApiRequest
}

describe('/api/chat access gate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key'
  })

  it('returns 405 for non-POST methods', async () => {
    const res = buildRes()
    await handler(req({ method: 'GET' }), res)
    expect(res.status).toHaveBeenCalledWith(405)
    expect(mockGetCurrentUser).not.toHaveBeenCalled()
  })

  it('returns 401 when there is no valid session', async () => {
    mockGetCurrentUser.mockRejectedValueOnce(new Error('no user found'))
    const res = buildRes()
    await handler(req(), res)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(mockStreamText).not.toHaveBeenCalled()
  })

  it('returns 403 for a non-admin user', async () => {
    mockGetCurrentUser.mockResolvedValueOnce({
      ...adminCtx,
      isUser: true,
      isDomainAdmin: false,
      isAdmin: false,
    })
    const res = buildRes()
    await handler(req(), res)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(mockStreamText).not.toHaveBeenCalled()
  })

  it('proceeds to streamText for an admin user', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(adminCtx)
    const pipe = jest.fn()
    mockStreamText.mockReturnValueOnce({ pipeUIMessageStreamToResponse: pipe })

    const res = buildRes()
    await handler(req(), res)

    expect(mockStreamText).toHaveBeenCalledTimes(1)
    expect(pipe).toHaveBeenCalledWith(res)
  })

  it('returns 400 when messages are missing', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(adminCtx)
    const res = buildRes()
    await handler(req({ body: {} }), res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(mockStreamText).not.toHaveBeenCalled()
  })

  it('returns 500 when the API key is missing', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(adminCtx)
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    const res = buildRes()
    await handler(req(), res)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(mockStreamText).not.toHaveBeenCalled()
  })
})
