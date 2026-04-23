import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import archiver from 'archiver'
import puppeteer from 'puppeteer'
import { generateHtmlFromThemplate } from './pdfThemplate'

export async function generatePdf(payment: IExtendedPayment): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  const html = await generateHtmlFromThemplate(payment)

  await page.setContent(html)

  const pdfBuffer = await page.pdf({
    format: 'a4',
    printBackground: true,
  })

  await browser.close()

  return pdfBuffer
}

export async function generateZip(
  payments: IExtendedPayment[]
): Promise<Buffer> {
  const archive = archiver('zip', { zlib: { level: 9 } })
  const buffers: Buffer[] = []

  const archivePromise = new Promise<Buffer>((resolve, reject) => {
    archive.on('data', (buffer) => {
      buffers.push(buffer)
    })

    archive.on('end', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      resolve(Buffer.concat(buffers))
    })

    archive.on('error', (err) => {
      reject(err)
    })
  })

  const browser = await puppeteer.launch({ headless: true })

  try {
    for (const payment of payments) {
      const page = await browser.newPage()
      const html = await generateHtmlFromThemplate(payment)
      
      await page.setContent(html)

      const pdfBuffer = await page.pdf({
        format: 'a4',
        printBackground: true,
      })
      await page.close()

      archive.append(pdfBuffer, {
        name: `${payment?.reciever?.companyName}-inv-${payment?.invoiceNumber}.pdf`,
      })
    }
  } finally {
    await browser.close()
  }

  archive.finalize()

  return archivePromise
}