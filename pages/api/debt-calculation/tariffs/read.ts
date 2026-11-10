import type { NextApiRequest, NextApiResponse } from 'next'
import { Data } from '@pages/api/api.config'
import { parsePdfDataUrl } from '@common/services/aiAssistant/documents/pdf'
import { readTariffsPdf } from '@common/services/debtTariffsService/debtTariffs.service'
import { withErrorHandler } from '@utils/api-handler'
import { canEditDomain } from '@utils/domain/domain-access'
import { getCurrentUser } from '@utils/getCurrentUser'

export const config = {
  api: {
    // One PDF as a data URL; the page refuses a bigger file.
    bodyParser: { sizeLimit: '4mb' },
  },
}

/**
 * @swagger
 * /api/debt-calculation/tariffs/read:
 *   post:
 *     summary: Reads a building's tariff table from a PDF (no model, nothing saved)
 *     tags: [DebtCalculation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [domainId, file]
 *             properties:
 *               domainId: { type: string }
 *               file: { type: string, description: "data:application/pdf;base64,…" }
 *     responses:
 *       200: { description: "`data` - { hasText, tariffs, warnings, street? }" }
 *       400: { description: Not a PDF }
 *       401: { description: Not signed in }
 *       403: { description: The user does not administer the domain }
 */
async function readTariffsHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, message: `Метод ${req.method} не дозволений` })
  }

  let access: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    access = await getCurrentUser(req, res)
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
  const domainId = String(req.body?.domainId ?? '')
  if (!(await canEditDomain(access, domainId))) {
    return res.status(403).json({ success: false, message: 'Немає доступу' })
  }

  const pdf = parsePdfDataUrl(req.body?.file)
  if (!pdf) {
    return res
      .status(400)
      .json({ success: false, message: 'Потрібен PDF-файл' })
  }

  try {
    const data = await readTariffsPdf(domainId, pdf)
    return res.status(200).json({ success: true, data })
  } catch (error) {
    // A damaged or password-protected file.
    console.error('Tariffs PDF read error:', error)
    return res
      .status(400)
      .json({ success: false, message: 'Не вдалося відкрити PDF' })
  }
}

export default withErrorHandler(readTariffsHandler)
