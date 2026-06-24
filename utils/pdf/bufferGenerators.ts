import archiver from 'archiver'

const isServerless =
  !!process.env.VERCEL_ENV || !!process.env.AWS_LAMBDA_FUNCTION_NAME

const COMMON_LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
]

// On serverless (Vercel/AWS Lambda) a bundled Chromium can't load its shared
// libraries (libnspr4.so etc.), so we always fetch the matching pack (binary +
// libs) at runtime via @sparticuz/chromium-min. Defaults to the public v127
// pack so it works even where we can't set env vars (AWS prod); override with
// CHROMIUM_PACK_URL to point at your own mirror. Must match @sparticuz/chromium*
// major (127) and puppeteer-core (22.x → Chrome 127).
const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_PACK_URL ||
  'https://github.com/Sparticuz/chromium/releases/download/v127.0.0/chromium-v127.0.0-pack.tar'

let executablePathPromise: Promise<string> | undefined

function resolveExecutablePath(
  chromium: {
    executablePath: (input?: string) => Promise<string>
  },
  input?: string
): Promise<string> {
  if (!executablePathPromise) {
    executablePathPromise = chromium.executablePath(input).catch((err) => {
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
        import('@sparticuz/chromium-min'),
      ])
    return puppeteerCore.launch({
      args: [...chromium.args, ...COMMON_LAUNCH_ARGS],
      defaultViewport: chromium.defaultViewport,
      executablePath: await resolveExecutablePath(chromium, CHROMIUM_PACK_URL),
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

  // Wrap in Buffer.from() so this compiles whether puppeteer-core returns
  // Buffer (v22) or Uint8Array (v23+) — downstream callers expect Buffer.
  const pdfBuffer = Buffer.from(
    await page.pdf({
      format: 'a4',
      printBackground: true,
    })
  )

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

      const pdfBuffer = Buffer.from(
        await page.pdf({
          format: 'a4',
          printBackground: true,
        })
      )
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
