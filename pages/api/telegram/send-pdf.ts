import type { NextApiRequest, NextApiResponse } from 'next'

// Server-side PDF generation was removed when invoice templates were unified
// on the client-side renderer. To restore this endpoint, send pre-rendered
// HTML from the client (see /api/spacehub/payment/htmlToPdf) and forward the
// resulting buffer to Telegram from here.

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  return res.status(501).json({
    error:
      'Telegram PDF sending temporarily unavailable after template refactor.',
  })
}
