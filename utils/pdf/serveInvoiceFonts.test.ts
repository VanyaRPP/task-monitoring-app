/**
 * @jest-environment node
 */
import { readFile } from 'fs/promises'
import path from 'path'
import { readInvoiceFont } from './serveInvoiceFonts'

const FONT = 'inter-latin-wght-normal.woff2'

describe('readInvoiceFont', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('serves a bundled invoice font from public/ without touching the network', async () => {
    const fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch

    const body = await readInvoiceFont(
      `http://unreachable.invalid/fonts/invoice/${FONT}`
    )

    expect(body).toEqual(
      await readFile(path.join(process.cwd(), 'public/fonts/invoice', FONT))
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('falls back to a server-side fetch when the file is not on disk', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2]).buffer,
    })) as unknown as typeof fetch

    await expect(
      readInvoiceFont('https://app.example/fonts/invoice/missing-latin.woff2')
    ).resolves.toEqual(Buffer.from([1, 2]))
  })

  it.each([
    'https://app.example/_next/static/app.css',
    'https://app.example/fonts/Outfit-Regular.ttf',
    'https://app.example/fonts/invoice/../../package.json',
    'not a url',
  ])('ignores %s', async (url) => {
    global.fetch = jest.fn() as unknown as typeof fetch
    await expect(readInvoiceFont(url)).resolves.toBeNull()
  })
})
