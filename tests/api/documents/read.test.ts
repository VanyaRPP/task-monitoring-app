import handler from '@pages/api/documents/read'
import { getCurrentUser } from '@utils/getCurrentUser'
import {
  readPhotoPage,
  surveyPhoto,
} from '@common/services/aiAssistant/documents'
import {
  PageReaderUnavailableError,
  RateLimitedError,
  readStatementRows,
  TruncatedDocumentError,
} from '@common/services/aiAssistant/documents/extract'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('@utils/getCurrentUser', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@common/services/aiAssistant/documents', () => ({
  parsePhotoDataUrl: jest.requireActual(
    '@common/services/aiAssistant/documents/index'
  ).parsePhotoDataUrl,
  surveyPhoto: jest.fn(),
  readPhotoPage: jest.fn(),
}))
jest.mock('@common/services/aiAssistant/documents/extract', () => {
  class RateLimitedError extends Error {
    constructor(readonly retryAfter: number) {
      super('rate')
    }
  }
  class TruncatedDocumentError extends Error {}
  class PageReaderUnavailableError extends Error {}
  return {
    RateLimitedError,
    TruncatedDocumentError,
    PageReaderUnavailableError,
    readStatementRows: jest.fn(),
  }
})

const IMAGE = 'data:image/jpeg;base64,QUJD'

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  res.setHeader = jest.fn()
  return res
}

const post = (body: unknown) => ({ method: 'POST', body }) as any

const admin = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  isAdmin: true,
  user: { email: 'admin@x.ua' },
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getCurrentUser as jest.Mock).mockResolvedValue(admin)
})

describe('POST /api/documents/read', () => {
  it('огляд фото — з правами користувача з сесії', async () => {
    ;(surveyPhoto as jest.Mock).mockResolvedValue({ documentType: 'unknown' })
    const res = makeRes()

    await handler(post({ step: 'survey', image: IMAGE }), res)

    expect(surveyPhoto).toHaveBeenCalledWith(
      { mediaType: 'image/jpeg', data: 'QUJD' },
      {
        isUser: false,
        isDomainAdmin: true,
        isGlobalAdmin: false,
        user: { email: 'admin@x.ua' },
      }
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('весь аркуш — першим кроком, з підбором компаній', async () => {
    ;(readPhotoPage as jest.Mock).mockResolvedValue({
      documentType: 'debtMonthlyStatement',
      rows: ['8/2018|1'],
    })
    const res = makeRes()

    await handler(post({ step: 'page', image: IMAGE }), res)

    expect(readPhotoPage).toHaveBeenCalledWith(
      { mediaType: 'image/jpeg', data: 'QUJD' },
      expect.objectContaining({ user: { email: 'admin@x.ua' } })
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('без читача аркуша — 409, щоб браузер читав смугами', async () => {
    ;(readPhotoPage as jest.Mock).mockRejectedValue(
      new PageReaderUnavailableError()
    )
    const res = makeRes()

    await handler(post({ step: 'page', image: IMAGE }), res)

    expect(res.status).toHaveBeenCalledWith(409)
  })

  it('смуга — з колонками, якщо їх передали', async () => {
    ;(readStatementRows as jest.Mock).mockResolvedValue({
      columns: ['М/Рік'],
      rows: ['8/2018'],
    })
    const res = makeRes()

    await handler(post({ step: 'rows', image: IMAGE, columns: ['М/Рік'] }), res)

    expect(readStatementRows).toHaveBeenCalledWith(
      { mediaType: 'image/jpeg', data: 'QUJD' },
      ['М/Рік']
    )
    expect(res.json.mock.calls[0][0].data.rows).toEqual(['8/2018'])
  })

  it('ліміт — 429 з часом очікування для браузера', async () => {
    ;(readStatementRows as jest.Mock).mockRejectedValue(
      new RateLimitedError(37)
    )
    const res = makeRes()

    await handler(post({ step: 'rows', image: IMAGE }), res)

    expect(res.status).toHaveBeenCalledWith(429)
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '37')
    expect(res.json.mock.calls[0][0].retryAfter).toBe(37)
  })

  it('задовга смуга — 422, щоб браузер поділив її', async () => {
    ;(readStatementRows as jest.Mock).mockRejectedValue(
      new TruncatedDocumentError()
    )
    const res = makeRes()

    await handler(post({ step: 'rows', image: IMAGE }), res)

    expect(res.status).toHaveBeenCalledWith(422)
  })

  it.each([
    ['без фото', { step: 'survey' }],
    ['не зображення', { step: 'survey', image: 'data:text/html;base64,QUJD' }],
    ['невідомий крок', { step: 'hack', image: IMAGE }],
  ])('відхиляє запит %s', async (_, body) => {
    const res = makeRes()

    await handler(post(body), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(surveyPhoto).not.toHaveBeenCalled()
  })

  it('не-адміну — 403, без сесії — 401, не POST — 405', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({ isAdmin: false })
    const forbidden = makeRes()
    await handler(post({ step: 'survey', image: IMAGE }), forbidden)
    expect(forbidden.status).toHaveBeenCalledWith(403)

    ;(getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error('no user'))
    const anonymous = makeRes()
    await handler(post({ step: 'survey', image: IMAGE }), anonymous)
    expect(anonymous.status).toHaveBeenCalledWith(401)

    const wrongMethod = makeRes()
    await handler({ method: 'GET' } as any, wrongMethod)
    expect(wrongMethod.status).toHaveBeenCalledWith(405)

    expect(surveyPhoto).not.toHaveBeenCalled()
  })
})
