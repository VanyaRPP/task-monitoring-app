import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import puppeteer from 'puppeteer'
import { generateHtmlFromThemplate } from './pdfThemplate'
import archiver from 'archiver'

export async function generatePdf(payment: IExtendedPayment): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  const html = await generateHtmlFromThemplate(payment)

  await page.setContent(html)

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
  })

  await browser.close()

  return pdfBuffer
}

export async function generateZip(payments: IExtendedPayment[]): Promise<Buffer> {
  const archive = archiver('zip', { zlib: { level: 9 } })

  const promises = payments.map(async (payment, index) => {
    const pdfBuffer = await generatePdf(payment)
    archive.append(pdfBuffer, {
      name: `${payments[index]?.reciever?.companyName}-inv-${payments[index]?.invoiceNumber}.pdf`,
    })
  })

  await Promise.all(promises)

  return new Promise((resolve, reject) => {
    archive.finalize()
    const buffers: Buffer[] = []

    archive.on('data', (buffer) => {
      buffers.push(buffer)
    })

    archive.on('end', () => {
      resolve(Buffer.concat(buffers))
    })

    archive.on('error', (err) => {
      reject(err)
    })
  })
}
