import start from '@pages/api/api.config'
import { getCurrentUser } from '@utils/getCurrentUser'
import { NextApiRequest, NextApiResponse } from 'next'
import { generatePdfFromHtml } from '@utils/pdf/bufferGenerators'

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: { sizeLimit: '8mb' },
    responseLimit: '8mb',
  },
}

interface HtmlToPdfBody {
  html: string
  fileName?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // Signed-in users only: an open endpoint let anyone on the internet make
  // the server run headless Chrome on HTML of their choosing.
  try {
    await start()
    await getCurrentUser(req, res)
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const { html, fileName } = req.body as HtmlToPdfBody

    if (!html || typeof html !== 'string') {
      res.status(400).json({ error: 'No html provided' })
      return
    }

    const pdfBuffer = await generatePdfFromHtml(html)

    res.json({
      fileName: fileName || 'invoice',
      fileExtension: 'pdf',
      buffer: pdfBuffer,
    })
  } catch (error) {
    const err = error as Error
    // eslint-disable-next-line no-console
    console.error('htmlToPdf handler failed:', err)
    res.status(500).json({
      error: err?.message ?? 'Internal Server Error',
    })
  }
}
