import archiver from 'archiver'

const isServerless =
  !!process.env.VERCEL_ENV || !!process.env.AWS_LAMBDA_FUNCTION_NAME

const COMMON_LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
]

let executablePathPromise: Promise<string> | undefined

function resolveExecutablePath(chromium: {
  executablePath: () => Promise<string>
}): Promise<string> {
  if (!executablePathPromise) {
    executablePathPromise = chromium.executablePath().catch((err) => {
      executablePathPromise = undefined
      throw err
    })
  }
  return executablePathPromise
}

async function launchBrowser() {
  if (isServerless) {
    const [{ default: puppeteerCore }, { default: chromium }] =
      await Promise.all([
        import('puppeteer-core'),
        import('@sparticuz/chromium'),
      ])
    return puppeteerCore.launch({
      args: [...chromium.args, ...COMMON_LAUNCH_ARGS],
      defaultViewport: chromium.defaultViewport,
      executablePath: await resolveExecutablePath(chromium),
      headless: true,
      protocolTimeout: 60_000,
    })
  }

  const { default: puppeteer } = await import('puppeteer')
  return puppeteer.launch({
    headless: true,
    args: COMMON_LAUNCH_ARGS,
    protocolTimeout: 60_000,
  })
}

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await launchBrowser()
  const page = await browser.newPage()

  await page.setContent(html, { waitUntil: 'networkidle0' })

  const pdfBuffer = await page.pdf({
    format: 'a4',
    printBackground: true,
  })

  await browser.close()

  return pdfBuffer
}

export interface HtmlToPdfItem {
  html: string
  fileName: string
}

export async function generateZipFromHtmls(
  items: HtmlToPdfItem[]
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

  const browser = await launchBrowser()

  try {
    for (const item of items) {
      const page = await browser.newPage()
      await page.setContent(item.html, { waitUntil: 'networkidle0' })

      const pdfBuffer = await page.pdf({
        format: 'a4',
        printBackground: true,
      })
      await page.close()

      const baseName = item.fileName || 'invoice'
      archive.append(pdfBuffer, { name: `${baseName}.pdf` })
    }
  } finally {
    await browser.close()
  }

  archive.finalize()

  return archivePromise
}
