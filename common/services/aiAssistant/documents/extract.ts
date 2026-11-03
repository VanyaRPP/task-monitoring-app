import { APICallError, generateText, Output, RetryError } from 'ai'
import { z } from 'zod'
import {
  getPageReader,
  getVisionModel,
  PAGE_MAX_OUTPUT_TOKENS,
  VISION_MAX_OUTPUT_TOKENS,
} from '@common/services/aiAssistant/config'
import type { IDocumentSurvey } from './types'

/**
 * The two vision calls behind a photo import.
 *
 * A real statement page holds ~46 months, and Groq's free tier writes at most
 * 1000 output tokens a minute (~20 rows). So a page is read in two steps: a
 * cheap survey of the whole photo (what it is, whose, how many rows), then the
 * rows strip by strip - the browser cuts the strips and paces them, since a
 * whole page takes minutes and no single request may.
 *
 * Column titles come from the first strip, not the survey: on a whole A4
 * page they are too small, and the survey of a real printout dropped one and
 * mixed up two - after which no row could be mapped.
 *
 * Neither call retries on its own: a rate limit is handed back to the browser
 * with the wait, instead of holding a serverless request open for a minute.
 *
 * Every schema field is required and nullable rather than optional - Groq's
 * strict JSON mode rejects optional properties.
 */

export interface IPhoto {
  /** Base64 payload, without the `data:` prefix. */
  data: string
  mediaType: string
}

/** The free tier's per-minute budget is spent; try again after `retryAfter` seconds. */
export class RateLimitedError extends Error {
  constructor(readonly retryAfter: number) {
    super(`Rate limited, retry after ${retryAfter}s`)
    this.name = 'RateLimitedError'
  }
}

/** The strip held more rows than the output cap allows; cut it smaller. */
export class TruncatedDocumentError extends Error {
  constructor() {
    super('The photo answer was cut off by the output cap')
    this.name = 'TruncatedDocumentError'
  }
}

const DEFAULT_RETRY_AFTER = 30

const providerError = (error: unknown): APICallError | null => {
  const cause = RetryError.isInstance(error) ? error.lastError : error
  return APICallError.isInstance(cause) ? cause : null
}

/**
 * Maps the provider's failures onto the two the browser can act on. Groq's
 * strict JSON mode reports a cut-off answer as a 400 `json_validate_failed`
 * whose `failed_generation` has already dropped the half-written rows, so
 * there is nothing to salvage - only to retry on a smaller strip.
 */
const translate = (error: unknown): unknown => {
  const cause = providerError(error)
  if (!cause) return error

  if (cause.statusCode === 429) {
    const header = Number(cause.responseHeaders?.['retry-after'])
    return new RateLimitedError(
      Number.isFinite(header) && header > 0
        ? Math.ceil(header)
        : DEFAULT_RETRY_AFTER
    )
  }

  const body = cause.responseBody ?? ''
  if (
    /json_validate_failed/.test(body) &&
    /max completion tokens/i.test(body)
  ) {
    return new TruncatedDocumentError()
  }

  return error
}

async function readPhoto<T>(
  photo: IPhoto,
  prompt: string,
  schema: z.ZodType<T>,
  maxOutputTokens: number
): Promise<T> {
  const result = await generateText({
    model: getVisionModel(),
    output: Output.object({ schema }),
    maxOutputTokens,
    maxRetries: 0,
    temperature: 0,
    // Thinking would spend the tiny output budget before a single row is written.
    providerOptions: { groq: { reasoningEffort: 'none' } },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image', image: photo.data, mediaType: photo.mediaType },
        ],
      },
    ],
  }).catch((error) => {
    throw translate(error)
  })

  // Providers that hand back a cut answer (Gemini) end with `length`.
  if (result.finishReason === 'length') throw new TruncatedDocumentError()

  return result.output
}

const surveySchema = z.object({
  documentType: z.enum(['debtMonthlyStatement', 'unknown']),
  header: z.object({
    address: z.string().nullable(),
    apartment: z.string().nullable(),
    ownerName: z.string().nullable(),
    accountNumber: z.string().nullable(),
  }),
  rowCount: z.number().int(),
})

const SURVEY_PROMPT =
  'Розпізнай документ на фото. Якщо це таблиця заборгованості по місяцях ' +
  '(рядок = місяць) - documentType=debtMonthlyStatement, інакше unknown. ' +
  'header - з шапки документа (адреса, номер квартири, ПІБ, особовий рахунок), ' +
  'чого немає - null. rowCount - скільки рядків-місяців у таблиці. ' +
  'Нічого не вигадуй.'

/** What is on the photo - enough to plan the strips and find the company. */
export async function surveyDocument(
  photo: IPhoto
): Promise<Omit<IDocumentSurvey, 'candidates' | 'suggestedCompanyId'>> {
  const survey = await readPhoto(photo, SURVEY_PROMPT, surveySchema, 300)

  return {
    documentType: survey.documentType,
    header: {
      address: survey.header?.address ?? null,
      apartment: survey.header?.apartment ?? null,
      ownerName: survey.header?.ownerName ?? null,
      accountNumber: survey.header?.accountNumber ?? null,
    },
    rowCount: Math.max(0, survey.rowCount ?? 0),
  }
}

const rowsSchema = z.object({ rows: z.array(z.string()) })
const headedRowsSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.string()),
})

const ROWS_RULES =
  'Перепиши КОЖЕН рядок-місяць, який видно повністю, по порядку. Кожен рядок ' +
  'таблиці = один елемент rows: клітинки зліва направо через |, числа як ' +
  'надруковано але без пробілів, порожня клітинка = пусто. Рядок з назвами ' +
  'колонок не переписуй. Нічого не вигадуй.'

// Kept close to the wording that read a full 18-row test sheet without a
// single wrong digit; a longer, rule-heavy version made Qwen3.8 misread
// "1 500,00" as 1000 on every run. Test on real photos before growing it.
const firstStripPrompt =
  'На фото - таблиця заборгованості по місяцях (або її верхня частина). ' +
  'columns - назви колонок таблиці зліва направо. ' +
  ROWS_RULES

const nextStripPrompt = (columns: string[]): string =>
  'На фото - частина таблиці заборгованості по місяцях з колонками: ' +
  `${columns.join(' | ')}. ` +
  ROWS_RULES

export interface IStripRows {
  /** Column titles - read off this strip when none were given. */
  columns: string[]
  /** Raw `cell|cell|…` lines in column order. */
  rows: string[]
}

/**
 * The rows of one strip. Without `columns` this is the top strip: it also
 * reads the column titles, which every following strip is then told.
 */
export async function readStatementRows(
  photo: IPhoto,
  columns?: string[]
): Promise<IStripRows> {
  if (columns?.length) {
    const { rows } = await readPhoto(
      photo,
      nextStripPrompt(columns),
      rowsSchema,
      VISION_MAX_OUTPUT_TOKENS
    )
    return { columns, rows: rows ?? [] }
  }

  const read = await readPhoto(
    photo,
    firstStripPrompt,
    headedRowsSchema,
    VISION_MAX_OUTPUT_TOKENS
  )
  return { columns: read.columns ?? [], rows: read.rows ?? [] }
}

/** No model is set up to read a whole page; the browser reads in strips. */
export class PageReaderUnavailableError extends Error {
  constructor() {
    super('No page reader configured')
    this.name = 'PageReaderUnavailableError'
  }
}

const pageSchema = z.object({
  documentType: z.enum(['debtMonthlyStatement', 'unknown']),
  header: z.object({
    address: z.string().nullable(),
    apartment: z.string().nullable(),
    ownerName: z.string().nullable(),
    accountNumber: z.string().nullable(),
  }),
  columns: z.array(z.string()),
  rows: z.array(z.string()),
})

// The wording that read five synthetic HOA sheets (46 rows each) without a
// wrong cell on Gemini 3.5 Flash-Lite. Test on photos before changing it.
const PAGE_PROMPT =
  'Розпізнай документ на фото. Якщо це таблиця заборгованості по місяцях ' +
  '(рядок = місяць) - documentType=debtMonthlyStatement, інакше unknown. ' +
  'header - з шапки документа (адреса, номер квартири, ПІБ, особовий ' +
  'рахунок), чого немає - null. columns - назви колонок таблиці зліва ' +
  'направо. Перепиши КОЖЕН рядок-місяць таблиці по порядку: один елемент ' +
  'rows = клітинки рядка зліва направо через |, числа як надруковано але ' +
  'без пробілів, порожня клітинка = пусто. Нічого не вигадуй.'

export type IPageRead = Omit<
  IDocumentSurvey,
  'candidates' | 'suggestedCompanyId'
> &
  IStripRows

/**
 * The whole photo in one call, by the page reader (see `getPageReader`):
 * what it is, whose, the column titles and every row. No strips - so no
 * seams, which is where strip reading lost and garbled rows. The photo
 * should arrive deskewed: on a tilted sheet the right-hand columns of a
 * stretch of rows get read one row off, by any model.
 */
export async function readStatementPage(photo: IPhoto): Promise<IPageRead> {
  const reader = getPageReader()
  if (!reader) throw new PageReaderUnavailableError()

  const result = await generateText({
    model: reader.model,
    output: Output.object({ schema: pageSchema }),
    maxOutputTokens: PAGE_MAX_OUTPUT_TOKENS,
    // One retry: Gemini answers 503 on demand spikes that pass in seconds.
    maxRetries: 1,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingLevel: 'low' },
        mediaResolution: 'MEDIA_RESOLUTION_HIGH',
      },
    },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: PAGE_PROMPT },
          { type: 'image', image: photo.data, mediaType: photo.mediaType },
        ],
      },
    ],
  }).catch((error) => {
    throw translate(error)
  })

  if (result.finishReason === 'length') throw new TruncatedDocumentError()

  const page = result.output
  return {
    documentType: page.documentType,
    header: {
      address: page.header?.address ?? null,
      apartment: page.header?.apartment ?? null,
      ownerName: page.header?.ownerName ?? null,
      accountNumber: page.header?.accountNumber ?? null,
    },
    rowCount: page.rows?.length ?? 0,
    columns: page.columns ?? [],
    rows: page.rows ?? [],
  }
}
