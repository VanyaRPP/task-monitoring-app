import type { UIMessage } from 'ai'
import type { UserContext } from '@common/services/paymentService/payment.service'
import {
  readStatementPage,
  surveyDocument,
  type IPageRead,
  type IPhoto,
} from './extract'
import { findCompanyCandidates } from './matchCompany'
import type { IDocumentSurvey } from './types'

const DATA_URL = /^data:([^;,]+);base64,(.+)$/

/** A `data:` URL as the browser sends it, split for the model. */
export function parsePhotoDataUrl(url: unknown): IPhoto | null {
  const match = typeof url === 'string' ? DATA_URL.exec(url) : null
  if (!match || !match[1].startsWith('image/')) return null

  return { mediaType: match[1], data: match[2] }
}

/**
 * Surveys a photo and, when it is a debt statement, finds the companies its
 * header points to. Nothing is written - the user saves from the chat card.
 */
export async function surveyPhoto(
  photo: IPhoto,
  ctx: UserContext
): Promise<IDocumentSurvey> {
  const survey = await surveyDocument(photo)

  if (survey.documentType !== 'debtMonthlyStatement') {
    return { ...survey, candidates: [], suggestedCompanyId: null }
  }

  const match = await findCompanyCandidates(survey.header, ctx)

  return { ...survey, ...match }
}

/**
 * Reads a whole photo with the page reader and, when it is a debt statement,
 * finds the companies its header points to. Nothing is written.
 */
export async function readPhotoPage(
  photo: IPhoto,
  ctx: UserContext
): Promise<
  IPageRead & Pick<IDocumentSurvey, 'candidates' | 'suggestedCompanyId'>
> {
  const page = await readStatementPage(photo)

  if (page.documentType !== 'debtMonthlyStatement') {
    return { ...page, candidates: [], suggestedCompanyId: null }
  }

  const match = await findCompanyCandidates(page.header, ctx)

  return { ...page, ...match }
}

/**
 * The history as the chat model may see it: images swapped for a marker.
 *
 * The chat model need not be able to see (gpt-oss-120b cannot), and an image
 * resent on every step would eat the token budget anyway. What a photo said
 * reaches the model through the batch part's text summary.
 */
export function withoutPhotos(messages: UIMessage[]): UIMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: (message.parts ?? []).map((part) =>
      part.type === 'file' && part.mediaType?.startsWith('image/')
        ? { type: 'text' as const, text: '[Фото документа]' }
        : part
    ),
  }))
}
