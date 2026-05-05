import { IGeneratePaymentPDF } from '@common/api/paymentApi/payment.api.types'
import { NextApiRequest, NextApiResponse } from 'next'
import {
  generatePdf,
  generateZip,
  getPaymentPdfBaseFileName,
} from '@utils/pdf/bufferGenerators'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'POST':
      try {
        const { payments } = req.body as IGeneratePaymentPDF

        if (!payments || payments.length === 0) {
          res.status(500).send('Internal Server Error')
          return
        }

        if (payments.length === 1) {
          const payment = payments[0]
          const pdfBuffer = await generatePdf(payment)

          res.setHeader('Content-Type', 'application/pdf')
          res.setHeader('Content-Disposition', 'attachment; filename=formData')

          res.json({
            fileName: getPaymentPdfBaseFileName(payment),
            fileExtension: 'pdf',
            buffer: pdfBuffer,
          })
        } else {
          const zipBuffer = await generateZip(payments)

          res.setHeader('Content-Type', 'application/zip')
          res.setHeader(
            'Content-Disposition',
            `attachment; filename=${'invoices' + new Date().toISOString()}`
          )

          res.json({
            fileName: `invoices-${new Date().toISOString()}`,
            fileExtension: 'zip',
            buffer: zipBuffer,
          })
        }
      } catch (error) {
        // TEMP: surface real error to client for preview-debugging on Vercel.
        // Remove stack/message from response after the root cause is fixed.
        const err = error as Error
        res.status(500).json({
          error: err?.message ?? 'Internal Server Error',
          stack: err?.stack,
        })
      }
  }
}
