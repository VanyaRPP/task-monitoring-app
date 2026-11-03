/**
 * @jest-environment node
 */
import { APICallError, generateText } from 'ai'
import RealEstate from '@modules/models/RealEstate'
import { companyOwnershipFilter } from '@common/services/aiAssistant/invoiceActions'
import { getPageReader } from '@common/services/aiAssistant/config'
import {
  PageReaderUnavailableError,
  RateLimitedError,
  readStatementPage,
  readStatementRows,
  surveyDocument,
  TruncatedDocumentError,
} from './extract'
import {
  findCompanyCandidates,
  headerClues,
  scoreCompany,
} from './matchCompany'
import { parsePhotoDataUrl, surveyPhoto, withoutPhotos } from './index'

jest.mock('ai', () => ({
  ...jest.requireActual('ai'),
  generateText: jest.fn(),
}))
jest.mock('@common/services/aiAssistant/config', () => ({
  getVisionModel: jest.fn(() => 'vision-model'),
  VISION_MAX_OUTPUT_TOKENS: 1000,
  getPageReader: jest.fn(() => ({ label: 'Google', model: 'page-model' })),
  PAGE_MAX_OUTPUT_TOKENS: 8192,
}))
jest.mock('@common/services/aiAssistant/invoiceActions', () => ({
  companyOwnershipFilter: jest.fn(async () => ({ adminEmails: 'a@b.c' })),
}))
jest.mock('@modules/models/RealEstate', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}))

const mockGenerateText = generateText as jest.Mock
const ctx = {
  isUser: false,
  isDomainAdmin: true,
  isGlobalAdmin: false,
  user: { email: 'a@b.c' },
}
const photo = { data: 'AAAA', mediaType: 'image/jpeg' }

const header = {
  address: 'вул. Покровська буд. 149 кв. 72',
  apartment: null,
  ownerName: null,
  accountNumber: null,
}

const providerError = (
  statusCode: number,
  responseBody: string,
  responseHeaders?: Record<string, string>
) =>
  new APICallError({
    message: 'provider error',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    requestBodyValues: {},
    statusCode,
    responseBody,
    responseHeaders,
    isRetryable: false,
  })

const mockCompanies = (companies: unknown[]) => {
  const query: any = {
    limit: jest.fn(() => query),
    populate: jest.fn(() => query),
    lean: jest.fn().mockResolvedValue(companies),
  }
  ;(RealEstate.find as jest.Mock).mockReturnValue(query)
}

const company = (id: string, companyName: string, street = '') => ({
  _id: id,
  companyName,
  description: '',
  domain: { _id: 'dom-1', name: 'ОСББ' },
  street: street ? { address: street } : null,
})

beforeEach(() => jest.clearAllMocks())

describe('surveyDocument', () => {
  it('нормалізує шапку й не просить більше 300 вихідних токенів', async () => {
    mockGenerateText.mockResolvedValue({
      finishReason: 'stop',
      output: {
        documentType: 'debtMonthlyStatement',
        header: { address: 'кв. 72' },
        rowCount: 46,
      },
    })

    const survey = await surveyDocument(photo)

    expect(survey).toEqual({
      documentType: 'debtMonthlyStatement',
      header: {
        address: 'кв. 72',
        apartment: null,
        ownerName: null,
        accountNumber: null,
      },
      rowCount: 46,
    })
    const call = mockGenerateText.mock.calls[0][0]
    expect(call.maxOutputTokens).toBe(300)
    // A rate limit goes back to the browser at once, not retried here.
    expect(call.maxRetries).toBe(0)
  })
})

describe('readStatementRows', () => {
  it('верхня смуга читає і назви колонок; наступні отримують їх готовими', async () => {
    mockGenerateText.mockResolvedValueOnce({
      finishReason: 'stop',
      output: { columns: ['М/Рік', 'Вхідне'], rows: ['8/2018|1'] },
    })
    mockGenerateText.mockResolvedValueOnce({
      finishReason: 'stop',
      output: { rows: ['9/2018|2'] },
    })

    const top = await readStatementRows(photo)
    const next = await readStatementRows(photo, top.columns)

    expect(top).toEqual({ columns: ['М/Рік', 'Вхідне'], rows: ['8/2018|1'] })
    expect(next).toEqual({ columns: ['М/Рік', 'Вхідне'], rows: ['9/2018|2'] })
    const secondPrompt =
      mockGenerateText.mock.calls[1][0].messages[0].content[0].text
    expect(secondPrompt).toContain('М/Рік | Вхідне')
    expect(mockGenerateText.mock.calls[1][0].maxOutputTokens).toBe(1000)
  })

  it('429 від Groq — RateLimitedError з часом очікування', async () => {
    mockGenerateText.mockRejectedValue(
      providerError(429, '{"error":{"code":"rate_limit_exceeded"}}', {
        'retry-after': '41',
      })
    )

    await expect(readStatementRows(photo, ['a'])).rejects.toEqual(
      new RateLimitedError(41)
    )
  })

  it('обрізана відповідь у строгому режимі Groq — TruncatedDocumentError', async () => {
    mockGenerateText.mockRejectedValue(
      providerError(
        400,
        JSON.stringify({
          error: {
            message:
              'max completion tokens reached before generating a valid document',
            code: 'json_validate_failed',
          },
        })
      )
    )

    await expect(readStatementRows(photo, ['a'])).rejects.toBeInstanceOf(
      TruncatedDocumentError
    )
  })

  it('інші збої не маскуються', async () => {
    mockGenerateText.mockRejectedValue(new Error('network down'))

    await expect(readStatementRows(photo, ['a'])).rejects.toThrow(
      'network down'
    )
  })
})

describe('headerClues / scoreCompany', () => {
  it('з адреси бере номер квартири й вулицю', () => {
    expect(headerClues(header)).toEqual({
      apartment: '72',
      street: 'Покровська',
    })
  })

  it('номер квартири рахується лише після №/кв., а не будь-де в назві', () => {
    const clues = { apartment: '72' }

    expect(scoreCompany({ companyName: 'Квартира №72' }, clues)).toBe(2)
    expect(scoreCompany({ companyName: 'кв. 72 Петренко' }, clues)).toBe(2)
    expect(scoreCompany({ companyName: 'Квартира №172' }, clues)).toBe(0)
    expect(scoreCompany({ companyName: 'Офіс 72 м²' }, clues)).toBe(0)
  })
})

describe('findCompanyCandidates', () => {
  it('з двох «кв. 72» обирає ту, що на Покровській', async () => {
    mockCompanies([
      company('c1', 'Квартира №72', 'вул. Шевченка 10'),
      company('c2', 'Квартира №72', 'вул. Покровська 149'),
    ])

    const result = await findCompanyCandidates(header, ctx)

    expect(result.suggestedCompanyId).toBe('c2')
    expect(result.candidates.map(({ id }) => id)).toEqual(['c2', 'c1'])
  })

  it('при нічиїй нічого не підставляє — користувач обирає сам', async () => {
    mockCompanies([company('c1', 'Квартира №72'), company('c2', 'кв. 72')])

    const result = await findCompanyCandidates(
      { ...header, address: 'кв. 72' },
      ctx
    )

    expect(result.suggestedCompanyId).toBeNull()
    expect(result.candidates).toHaveLength(2)
  })

  it('шукає лише серед доступних компаній і не пускає текст з фото в regex', async () => {
    mockCompanies([])

    await findCompanyCandidates({ ...header, ownerName: 'Пе.*нко (x' }, ctx)

    expect(companyOwnershipFilter).toHaveBeenCalledWith(ctx)
    const filters = (RealEstate.find as jest.Mock).mock.calls.map(([f]) => f)
    expect(filters.every((f) => f.$and[0].adminEmails === 'a@b.c')).toBe(true)
    expect(filters.some((f) => f.$and[2].companyName?.$regex === 'Пенко')).toBe(
      true
    )
  })

  it('без зачіпок у шапці не ходить у базу', async () => {
    const result = await findCompanyCandidates(
      { address: null, apartment: null, ownerName: null, accountNumber: null },
      ctx
    )

    expect(result).toEqual({ candidates: [], suggestedCompanyId: null })
    expect(RealEstate.find).not.toHaveBeenCalled()
  })
})

describe('surveyPhoto', () => {
  it('не таблиця боргу — без пошуку компаній', async () => {
    mockGenerateText.mockResolvedValue({
      finishReason: 'stop',
      output: { documentType: 'unknown', header: {}, rowCount: 0 },
    })

    const survey = await surveyPhoto(photo, ctx)

    expect(survey.documentType).toBe('unknown')
    expect(survey.candidates).toEqual([])
    expect(RealEstate.find).not.toHaveBeenCalled()
  })
})

describe('parsePhotoDataUrl / withoutPhotos', () => {
  it('приймає лише data URL зображення', () => {
    expect(parsePhotoDataUrl('data:image/jpeg;base64,QUJD')).toEqual({
      mediaType: 'image/jpeg',
      data: 'QUJD',
    })
    expect(parsePhotoDataUrl('data:text/html;base64,QUJD')).toBeNull()
    expect(parsePhotoDataUrl('https://example.com/a.jpg')).toBeNull()
  })

  it('чат-модель не отримує зображень', () => {
    const [message] = withoutPhotos([
      {
        id: '1',
        role: 'user',
        parts: [
          {
            type: 'file',
            mediaType: 'image/jpeg',
            url: 'data:image/jpeg;base64,QUJD',
          },
          { type: 'text', text: 'ось' },
        ],
      },
    ])

    expect(message.parts).toEqual([
      { type: 'text', text: '[Фото документа]' },
      { type: 'text', text: 'ось' },
    ])
  })
})

describe('readStatementPage', () => {
  it('весь аркуш одним викликом Gemini: висока роздільність, мало «думання», запас на 46+ рядків', async () => {
    mockGenerateText.mockResolvedValue({
      finishReason: 'stop',
      output: {
        documentType: 'debtMonthlyStatement',
        header: { address: 'кв. 72' },
        columns: ['М/Рік', 'Вхідне'],
        rows: ['8/2018|1', '9/2018|2'],
      },
    })

    const page = await readStatementPage(photo)

    expect(page).toMatchObject({
      rowCount: 2,
      columns: ['М/Рік', 'Вхідне'],
      rows: ['8/2018|1', '9/2018|2'],
    })
    const call = mockGenerateText.mock.calls[0][0]
    expect(call.model).toBe('page-model')
    expect(call.maxOutputTokens).toBe(8192)
    expect(call.providerOptions.google).toEqual({
      thinkingConfig: { thinkingLevel: 'low' },
      mediaResolution: 'MEDIA_RESOLUTION_HIGH',
    })
  })

  it('без читача аркуша — окрема помилка, щоб перейти на смуги', async () => {
    ;(getPageReader as jest.Mock).mockReturnValueOnce(null)

    await expect(readStatementPage(photo)).rejects.toBeInstanceOf(
      PageReaderUnavailableError
    )
    expect(mockGenerateText).not.toHaveBeenCalled()
  })
})
