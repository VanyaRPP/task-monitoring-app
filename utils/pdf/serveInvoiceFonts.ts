import { readFile } from 'fs/promises'
import path from 'path'

export interface InterceptedRequest {
  url(): string
  respond(response: {
    status: number
    contentType: string
    headers: Record<string, string>
    body: Buffer
  }): Promise<void>
  continue(): Promise<void>
}

export interface InterceptingPage {
  setRequestInterception(value: boolean): Promise<void>
  on(event: 'request', handler: (request: InterceptedRequest) => void): unknown
}

const INVOICE_FONT_FILE = /^\/fonts\/invoice\/([\w-]+\.woff2)$/

// The html is rendered on about:blank (origin "null"), so the browser fetches
// the invoice fonts as cross-origin requests from the site itself. Without an
// Access-Control-Allow-Origin on that response (a dev server not restarted
// after the next.config change, deployment protection, an auth proxy, an
// unreachable origin) every font is rejected and the pinned stacks render in
// Chromium's default Times. Serving them from here takes the network and CORS
// out of the download.
export async function readInvoiceFont(url: string): Promise<Buffer | null> {
  let file: string | undefined
  try {
    file = new URL(url).pathname.match(INVOICE_FONT_FILE)?.[1]
  } catch {
    return null
  }
  if (!file) return null

  try {
    return await readFile(
      path.join(process.cwd(), 'public', 'fonts', 'invoice', file)
    )
  } catch {
    // Not on disk (e.g. a serverless bundle without public/) — fetch it
    // server-side instead, where CORS does not apply.
  }
  try {
    const res = await fetch(url)
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null
  } catch {
    return null
  }
}

export async function serveInvoiceFonts(page: InterceptingPage): Promise<void> {
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    readInvoiceFont(request.url())
      .then((body) =>
        body
          ? request.respond({
              status: 200,
              contentType: 'font/woff2',
              headers: { 'Access-Control-Allow-Origin': '*' },
              body,
            })
          : request.continue()
      )
      .catch(() => request.continue().catch(() => undefined))
  })
}
