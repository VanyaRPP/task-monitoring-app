import handler from './chat'
import { getCurrentUser } from '@utils/getCurrentUser'
import { convertToModelMessages, streamText } from 'ai'
import { getModel } from '@common/services/aiAssistant/config'
import type { NextApiRequest, NextApiResponse } from 'next'

jest.mock('@utils/getCurrentUser', () => ({ getCurrentUser: jest.fn() }))
// Mock config so the test doesn't pull real provider SDKs (Web Streams) and can
// simulate a missing API key via getModel throwing.
jest.mock('@common/services/aiAssistant/config', () => ({
  getModel: jest.fn(() => 'mock-model'),
  AI_MAX_STEPS: 5,
}))
jest.mock('@common/services/aiAssistant/tools', () => ({
  buildAssistantTools: jest.fn(() => ({})),
}))
// The real module pulls in the vision model and Mongo models; the route only
// needs its history filter.
jest.mock('@common/services/aiAssistant/documents', () => ({
  withoutPhotos: (messages: any[]) =>
    messages.map((message) => ({
      ...message,
      parts: message.parts.map((part: any) =>
        part.type === 'file' ? { type: 'text', text: '[Фото документа]' } : part
      ),
    })),
}))
jest.mock('ai', () => ({
  streamText: jest.fn(),
  convertToModelMessages: jest.fn(async (m) => m),
  stepCountIs: jest.fn(() => 'stop'),
}))

const mockGetCurrentUser = getCurrentUser as jest.Mock
const mockStreamText = streamText as jest.Mock
const mockGetModel = getModel as jest.Mock

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
    mockGetModel.mockReturnValue('mock-model')
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

  it('returns 500 when the provider API key is missing', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(adminCtx)
    mockGetModel.mockImplementationOnce(() => {
      throw new Error('GROQ_API_KEY is missing or empty.')
    })
    const res = buildRes()
    await handler(req(), res)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(mockStreamText).not.toHaveBeenCalled()
  })
})

describe('/api/chat photo history', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetModel.mockReturnValue('mock-model')
    mockGetCurrentUser.mockResolvedValue(adminCtx)
    mockStreamText.mockReturnValue({ pipeUIMessageStreamToResponse: jest.fn() })
  })

  const history = [
    {
      id: 'photos',
      role: 'user',
      parts: [
        {
          type: 'file',
          mediaType: 'image/jpeg',
          url: 'data:image/jpeg;base64,QUJD',
        },
      ],
    },
    {
      id: 'batch',
      role: 'assistant',
      parts: [
        {
          type: 'data-documentBatch',
          data: { batchId: 'b1', summary: '[кв. 72: 93 міс.]' },
        },
      ],
    },
    {
      id: 'q',
      role: 'user',
      parts: [{ type: 'text', text: 'скільки боргу?' }],
    },
  ]

  it('чат-модель не бачить фото, а про прочитане дізнається з підсумку пачки', async () => {
    await handler(req({ body: { messages: history } }), buildRes())

    const [sent, options] = (convertToModelMessages as jest.Mock).mock.calls[0]
    expect(JSON.stringify(sent)).not.toContain('data:image')
    expect(
      options.convertDataPart({
        type: 'data-documentBatch',
        data: { batchId: 'b1', summary: '[кв. 72: 93 міс.]' },
      })
    ).toEqual({ type: 'text', text: '[кв. 72: 93 міс.]' })
    expect(
      options.convertDataPart({
        type: 'data-documentBatch',
        data: { batchId: 'b1' },
      })
    ).toEqual({ type: 'text', text: '[Фото документів ще обробляються]' })
    expect(options.convertDataPart({ type: 'data-other', data: {} })).toBe(
      undefined
    )
  })
})
