import { IExtendedPayment } from '@common/api/paymentApi/payment.api.types'
import archiver from 'archiver'
import dayjs from 'dayjs'
import puppeteer from 'puppeteer'
import { generateHtmlFromThemplate } from './pdfThemplate'

const PUPPETEER_LAUNCH_OPTIONS = {
  headless: true as const,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ],
  protocolTimeout: 60_000,
}

export function getModernInvoiceFileSlug(payment: IExtendedPayment): string {
  const invoiceNo = String(payment?.invoiceNumber ?? '')
  const invoiceDatePrefix = dayjs(payment?.invoiceCreationDate).isValid()
    ? dayjs(payment.invoiceCreationDate).format('DDMMYY')
    : ''
  return `${invoiceDatePrefix}${invoiceNo}`
}

export function getPaymentPdfBaseFileName(payment: IExtendedPayment): string {
  const companyName = payment?.reciever?.companyName ?? 'invoice'
  const slug = getModernInvoiceFileSlug(payment)
  return `${companyName} inv ${slug}`.trim()
}

export async function generatePdf(payment: IExtendedPayment): Promise<Buffer> {
  const browser = await puppeteer.launch(PUPPETEER_LAUNCH_OPTIONS)
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

  const browser = await puppeteer.launch(PUPPETEER_LAUNCH_OPTIONS)

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

      const slug = getModernInvoiceFileSlug(payment)
      const archiveBaseName = `${payment?.reciever?.companyName}-inv-${slug}`

      archive.append(pdfBuffer, {
        name: `${archiveBaseName}.pdf`,
      })
    }
  } finally {
    await browser.close()
  }

  archive.finalize()

  return archivePromise
}