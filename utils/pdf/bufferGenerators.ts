import archiver from 'archiver'
import { existsSync, rmSync } from 'fs'

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

// AWS Lambda's nodejs20.x/nodejs22.x runtimes are Amazon Linux 2023; nodejs18.x
// and older are Amazon Linux 2. @sparticuz/chromium@127 picks between the two
// lib bundles by string-matching "20.x" in AWS_EXECUTION_ENV, so on nodejs22.x
// it takes the AL2 branch: it extracts al2.tar.br (which has no libnspr4.so,
// because AL2's base image already ships it) and points LD_LIBRARY_PATH at
// /tmp/al2/lib. Chromium then dies with
//   "libnspr4.so: cannot open shared object file: No such file or directory".
// Derive the bundle from the Node version actually running and normalise the
// variable before the module is imported, so its top-level LD_LIBRARY_PATH /
// FONTCONFIG_PATH setup and its later extract both take the AL2023 branch.
const CHROMIUM_LIB_DIR = alignChromiumRuntimeEnv()

function alignChromiumRuntimeEnv(): string {
  const nodeMajor = Number(process.versions.node.split('.')[0])
  const usesAl2023 = !Number.isNaN(nodeMajor) && nodeMajor >= 20

  if (isServerless) {
    process.env.AWS_EXECUTION_ENV = usesAl2023
      ? 'AWS_Lambda_nodejs20.x'
      : 'AWS_Lambda_nodejs18.x'
  }

  return usesAl2023 ? '/tmp/al2023/lib' : '/tmp/al2/lib'
}

// executablePath() returns /tmp/chromium as soon as that file exists, without
// extracting anything else. A warm container that already unpacked the binary
// against the wrong lib bundle would therefore stay broken forever, so drop the
// binary when its libraries are missing and let the next call re-extract.
function dropStaleChromiumBinary(): void {
  try {
    if (
      existsSync('/tmp/chromium') &&
      !existsSync(`${CHROMIUM_LIB_DIR}/libnss3.so`)
    ) {
      rmSync('/tmp/chromium', { force: true })
    }
  } catch {
    // Best effort only - if /tmp isn't writable the launch below reports it.
  }
}

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
    dropStaleChromiumBinary()

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
