import type { NextApiRequest, NextApiResponse } from 'next'
import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { UserContext } from '@common/services/paymentService/payment.service'
import {
  parsePhotoDataUrl,
  readPhotoPage,
  surveyPhoto,
} from '@common/services/aiAssistant/documents'
import {
  PageReaderUnavailableError,
  RateLimitedError,
  readStatementRows,
  TruncatedDocumentError,
} from '@common/services/aiAssistant/documents/extract'

export const config = {
  api: {
    // One photo or strip as a data URL; the widget keeps it well under this.
    bodyParser: { sizeLimit: '4mb' },
  },
}

const MAX_COLUMNS = 20

/**
 * One vision step of a photo import, paced by the browser.
 *
 * - `page`: the whole photo by the page reader (Gemini) → what it is, whose,
 *   its columns and every row, plus candidate companies. First choice; 409
 *   when no page reader is set up, and the browser falls back to:
 * - `survey`: the whole photo → what it is, whose, its row count and
 *   the companies it may belong to.
 * - `rows`: one strip of it → its rows, as raw `cell|cell|…` lines. The top
 *   strip goes without `columns` and reads the column titles too; the rest
 *   are told the titles.
 *
 * 429 carries `retryAfter` seconds (the free tier's per-minute budget); 422
 * means the strip held too many rows and should be cut in two. Nothing is
 * written here.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ success: false, message: 'Method Not Allowed' })
    return
  }

  let ctx: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    await start()
    ctx = await getCurrentUser(req, res)
  } catch {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }

  // Admin-only, like the chat: every call spends the shared AI budget.
  if (!ctx.isAdmin) {
    res.status(403).json({ success: false, message: 'Forbidden' })
    return
  }

  const { step, image, columns } = req.body ?? {}
  const photo = parsePhotoDataUrl(image)
  if (!photo || !['page', 'survey', 'rows'].includes(step)) {
    res.status(400).json({ success: false, message: 'Потрібні крок і фото' })
    return
  }

  const titles = Array.isArray(columns)
    ? columns.slice(0, MAX_COLUMNS).map((title) => String(title).slice(0, 60))
    : []
  const userContext: UserContext = {
    isUser: ctx.isUser,
    isDomainAdmin: ctx.isDomainAdmin,
    isGlobalAdmin: ctx.isGlobalAdmin,
    user: { email: ctx.user.email },
  }

  try {
    const data =
      step === 'page'
        ? await readPhotoPage(photo, userContext)
        : step === 'survey'
          ? await surveyPhoto(photo, userContext)
          : await readStatementRows(photo, titles)

    res.status(200).json({ success: true, data })
  } catch (error) {
    if (error instanceof RateLimitedError) {
      res.setHeader('Retry-After', String(error.retryAfter))
      res
        .status(429)
        .json({ success: false, retryAfter: error.retryAfter, message: 'rate' })
      return
    }
    if (error instanceof PageReaderUnavailableError) {
      res.status(409).json({ success: false, message: 'no-page-reader' })
      return
    }
    if (error instanceof TruncatedDocumentError) {
      res.status(422).json({ success: false, message: 'too-long' })
      return
    }

    console.error('Photo import read error:', error)
    res
      .status(500)
      .json({ success: false, message: 'Не вдалося прочитати фото' })
  }
}
