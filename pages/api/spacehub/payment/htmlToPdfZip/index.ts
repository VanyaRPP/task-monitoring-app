import { NextApiRequest, NextApiResponse } from 'next'
import {
  generateZipFromHtmls,
  HtmlToPdfItem,
} from '@utils/pdf/bufferGenerators'

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: { sizeLimit: '32mb' },
    responseLimit: '32mb',
  },
}

interface HtmlToPdfZipBody {
  items: HtmlToPdfItem[]
  zipName?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { items, zipName } = req.body as HtmlToPdfZipBody

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'No items provided' })
      return
    }

    const invalidItem = items.find(
      (it) =>
        !it || typeof it.html !== 'string' || typeof it.fileName !== 'string'
    )
    if (invalidItem) {
      res.status(400).json({ error: 'Each item must have html and fileName' })
      return
    }

    const buffer = await generateZipFromHtmls(items)

    res.json({
      fileName: zipName || `invoices-${new Date().toISOString()}`,
      fileExtension: 'zip',
      buffer,
    })
  } catch (error) {
    const err = error as Error
    // eslint-disable-next-line no-console
    console.error('htmlToPdfZip handler failed:', err)
    res.status(500).json({
      error: err?.message ?? 'Internal Server Error',
    })
  }
}
