import { INVOICE_FONT_FAMILIES } from '@utils/pdf/invoicePageStyle'

export const PRINT_FRAME_ID = 'invoice-print-frame'

export function printInvoiceHtml(html: string, documentTitle?: string): void {
  if (typeof document === 'undefined') return

  document.getElementById(PRINT_FRAME_ID)?.remove()

  const viewportWidth = Math.max(document.documentElement.clientWidth, 794)
  const viewportHeight = Math.max(document.documentElement.clientHeight, 1123)

  const frame = document.createElement('iframe')
  frame.id = PRINT_FRAME_ID
  frame.setAttribute('aria-hidden', 'true')
  frame.width = `${viewportWidth}`
  frame.height = `${viewportHeight}`
  frame.style.position = 'absolute'
  frame.style.border = '0'
  frame.style.top = `-${viewportHeight + 100}px`
  frame.style.left = `-${viewportWidth + 100}px`

  frame.onload = () => {
    const frameWindow = frame.contentWindow
    const frameDocument = frameWindow?.document

    if (!frameWindow || !frameDocument?.body?.firstChild) return
    frame.onload = null

    // The load event doesn't wait for web fonts, and fonts.ready alone can
    // resolve before layout has even requested them. Ask for every invoice
    // family against the page text explicitly, then wait for the set.
    const fonts = frameDocument.fonts
    const text = frameDocument.body.textContent ?? ''
    const fontsReady = fonts
      ? Promise.all(
          INVOICE_FONT_FAMILIES.map((family) =>
            fonts.load(`16px "${family}"`, text)
          )
        ).then(() => fonts.ready)
      : Promise.resolve()

    const reportUnloadedFonts = () => {
      const failed = Array.from(fonts ?? [])
        .filter((face) => face.status === 'error')
        .map((face) => face.family)
      if (failed.length) {
        // Without these faces the invoice prints in the browser's default font.
        console.warn('Invoice print fonts failed to load:', failed)
      }
    }

    fontsReady
      .catch(() => undefined)
      .then(() => {
        reportUnloadedFonts()
        const previousTitle = document.title
        if (documentTitle) document.title = documentTitle

        frameWindow.addEventListener('afterprint', () => frame.remove(), {
          once: true,
        })

        try {
          frameWindow.focus()
          frameWindow.print()
        } catch {
          frame.remove()
        } finally {
          document.title = previousTitle
        }
      })
  }

  frame.srcdoc = html
  document.body.appendChild(frame)
}
