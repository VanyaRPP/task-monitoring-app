import {
  IExtendedPayment,
  IGeneratePaymentPDF,
} from '@common/api/paymentApi/payment.api.types'
import { NextApiRequest, NextApiResponse } from 'next'
import { generatePdf, generateZip } from '@utils/pdf/bufferGenerators'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'POST':
      try {
        const { payments } = req.body as IGeneratePaymentPDF

        if (payments.length === 1) {
          const payment = payments[0]
          const pdfBuffer = await generatePdf(payment)

          res.setHeader('Content-Type', 'application/pdf')
          res.setHeader('Content-Disposition', 'attachment; filename=formData')

          const response = {
            fileName: `${payments[0]?.reciever?.companyName}-inv-${payments[0]?.invoiceNumber}`,
            fileExtension: 'pdf',
            buffer: pdfBuffer,
          }

          res.json(response)
        }
        if (payments.length > 1) {
          const zipBuffer = await generateZip(payments)

          res.setHeader('Content-Type', 'application/zip')
          res.setHeader(
            'Content-Disposition',
            `attachment; filename=${'invoices' + new Date().toISOString()}`
          )

          const response = {
            fileName:  `invoices-${new Date().toISOString()}`,
            fileExtension: 'zip',
            buffer: zipBuffer,
          }

          res.json(response)
        } else {
          res.status(500).send('Internal Server Error')
        }
      } catch (error) {
        res.status(500).send('Internal Server Error')
      }
  }
}
