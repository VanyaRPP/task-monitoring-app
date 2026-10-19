import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import start, { Data } from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import type { UserContext } from '@common/services/paymentService/payment.service'
import {
  buildInvoiceDraftFromText,
  NoServicesInTextError,
} from '@common/services/aiAssistant/invoiceFromText'
import {
  RateLimitedError,
  TruncatedDocumentError,
} from '@common/services/aiAssistant/documents/extract'

const MAX_TEXT_LENGTH = 4000

const ACCESS_ERRORS: Record<string, { status: number; message: string }> = {
  'company not accessible': {
    status: 403,
    message: 'Немає доступу до компанії',
  },
  'this company belongs to another provider': {
    status: 400,
    message: 'Компанія не належить обраному надавачу',
  },
}

/**
 * @swagger
 * /api/spacehub/payment/draft-from-text:
 *   post:
 *     tags:
 *       - Payment
 *     summary: Build an invoice draft from services described in words
 *     description: >
 *       The AI agent reads the month and the services from the text and
 *       returns the draft the invoice form opens with, for the picked
 *       provider and company. Nothing is saved. Admins only.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text, companyId, domainId]
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 4000
 *                 example: травень - оренда 5000, світло 150 кВт по 4.32
 *               companyId:
 *                 type: string
 *               domainId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice draft for the form
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     draft:
 *                       type: object
 *       400:
 *         description: Missing text or ids, or the company is not the provider's
 *       401:
 *         description: Not signed in
 *       403:
 *         description: Not an admin, or no access to the company
 *       405:
 *         description: Method not allowed
 *       422:
 *         description: No services found in the text, or the text is too long
 *       429:
 *         description: AI rate limit; see the Retry-After header
 *       500:
 *         description: AI request failed
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res
      .status(405)
      .json({ success: false, message: 'Method Not Allowed' })
  }

  await start()

  let ctx: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    ctx = await getCurrentUser(req, res)
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }

  if (!ctx.isAdmin) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }

  const body = req.body ?? {}
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  const companyId = String(body.companyId ?? '')
  const domainId = String(body.domainId ?? '')

  if (
    !mongoose.Types.ObjectId.isValid(companyId) ||
    !mongoose.Types.ObjectId.isValid(domainId)
  ) {
    return res
      .status(400)
      .json({ success: false, message: 'Оберіть надавача і компанію' })
  }
  if (!text || text.length > MAX_TEXT_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Потрібен текст до ${MAX_TEXT_LENGTH} символів`,
    })
  }

  const userContext: UserContext = {
    isUser: ctx.isUser,
    isDomainAdmin: ctx.isDomainAdmin,
    isGlobalAdmin: ctx.isGlobalAdmin,
    user: { email: ctx.user.email },
  }

  try {
    const draft = await buildInvoiceDraftFromText({
      text,
      companyId,
      domainId,
      ctx: userContext,
    })
    return res.status(200).json({ success: true, data: { draft } })
  } catch (error) {
    if (error instanceof RateLimitedError) {
      res.setHeader('Retry-After', String(error.retryAfter))
      return res.status(429).json({
        success: false,
        message: `AI перевантажений, спробуйте через ${error.retryAfter} с`,
      })
    }
    if (error instanceof NoServicesInTextError) {
      return res.status(422).json({
        success: false,
        message: 'У тексті не знайдено жодної послуги',
      })
    }
    if (error instanceof TruncatedDocumentError) {
      return res.status(422).json({
        success: false,
        message: 'Текст задовгий, скоротіть його',
      })
    }
    const access = ACCESS_ERRORS[(error as Error)?.message]
    if (access) {
      return res
        .status(access.status)
        .json({ success: false, message: access.message })
    }

    console.error('Invoice draft from text error:', error)
    return res
      .status(500)
      .json({ success: false, message: 'Не вдалося підготувати рахунок' })
  }
}
