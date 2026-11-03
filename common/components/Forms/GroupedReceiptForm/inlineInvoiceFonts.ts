const FONT_URL = /\/fonts\/invoice\/[\w.-]+\.woff2/g

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  // Chunked: String.fromCharCode(...bytes) overflows the stack on ~100KB.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

// The print frame otherwise fetches the invoice fonts over the network from
// inside an about:srcdoc document, where a service worker, cache or the
// browser's print renderer can leave them unloaded — and a pinned stack with
// no loaded face prints in the UA default (Times). data: urls remove the
// network from printing entirely. The download keeps plain urls: puppeteer
// fetches them fine and the html posted to the server stays small.
export async function inlineInvoiceFonts(html: string): Promise<string> {
  const urls = Array.from(new Set(html.match(FONT_URL) ?? []))

  const inlined = await Promise.all(
    urls.map(async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`invoice font ${url}: HTTP ${res.status}`)
      const data = toBase64(await res.arrayBuffer())
      return [url, `data:font/woff2;base64,${data}`] as const
    })
  )

  return inlined.reduce(
    (out, [url, dataUrl]) => out.split(url).join(dataUrl),
    html
  )
}
