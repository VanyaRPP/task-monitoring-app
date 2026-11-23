import { inlineInvoiceFonts } from './inlineInvoiceFonts'

const fontResponse = (bytes: number[]) =>
  ({
    ok: true,
    status: 200,
    arrayBuffer: async () => new Uint8Array(bytes).buffer,
  }) as Response

describe('inlineInvoiceFonts', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('replaces every invoice font url with a data url, fetching each once', async () => {
    const fetchMock = jest.fn(async () => fontResponse([1, 2, 3]))
    global.fetch = fetchMock as unknown as typeof fetch

    const url = '/fonts/invoice/inter-latin-wght-normal.woff2'
    const html = `<style>@font-face { src: url('${url}'); } @font-face { src: url('${url}'); }</style>`

    const result = await inlineInvoiceFonts(html)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result).not.toContain(url)
    expect(result.match(/data:font\/woff2;base64,AQID/g)).toHaveLength(2)
  })

  it('leaves html without invoice fonts untouched', async () => {
    const fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch

    await expect(inlineInvoiceFonts('<div>x</div>')).resolves.toBe(
      '<div>x</div>'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects when a font cannot be fetched', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 404,
    })) as unknown as typeof fetch

    await expect(
      inlineInvoiceFonts("url('/fonts/invoice/x-latin-wght-normal.woff2')")
    ).rejects.toThrow('HTTP 404')
  })
})
