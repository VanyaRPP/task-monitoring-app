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
  }

  frame.srcdoc = html
  document.body.appendChild(frame)
}
