import {
  INVOICE_FONT_BASE_CSS,
  INVOICE_FONT_CSS,
  INVOICE_PAGE_CSS,
  pinInvoiceFonts,
} from '@utils/pdf/invoicePageStyle'

export function collectAppCss(): string {
  const parts: string[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules
      if (!rules) continue
      for (const rule of Array.from(rules)) {
        parts.push(rule.cssText)
      }
    } catch {}
  }
  return parts.join('\n')
}

export const PDF_RESET_CSS = `
  html, body { margin: 0; padding: 0; height: auto; background: #fff; }
  *, *::before, *::after { box-sizing: border-box; }
  /* Same page box as the puppeteer download (INVOICE_PAGE_MARGIN), so print
     and download wrap identically and nothing touches the paper edge. */
  ${INVOICE_PAGE_CSS}
  /* The captured template root may have height:100% / min-height — those
     would prevent puppeteer from paginating overflow. Reset on the
     immediate body children only, not deeper. */
  body > * { height: auto !important; min-height: 0 !important; max-height: none !important; }
  /* Help puppeteer break tables across pages cleanly. */
  table { page-break-inside: auto; }
  tr, td, th { page-break-inside: avoid; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
`

// The collected app css carries whatever @page rules the loaded stylesheets
// had (templates used to ship their own, some with margin: 0 !important, which
// Chrome lets beat ours). INVOICE_PAGE_CSS must be the only page box.
// The app's own @font-face rules go too: pinInvoiceFonts would otherwise
// rename their family and graft Work Sans/Outfit onto 'Invoice Sans'.
export function stripPageRules(css: string): string {
  return css.replace(/@(page|font-face)\b[^{]*\{[^{}]*\}/g, '')
}

function pinInlineStyleFonts(html: string): string {
  return html.replace(
    /style="([^"]*)"/g,
    (_, style: string) => `style="${pinInvoiceFonts(style)}"`
  )
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface StandaloneHtmlOptions {
  title?: string
  // Absolute origin for root-relative urls (fonts, images): puppeteer renders
  // the html on about:blank, where '/fonts/...' resolves to nothing.
  baseUrl?: string
}

export function buildStandaloneHtml(
  innerHtml: string,
  css: string,
  { title, baseUrl }: StandaloneHtmlOptions = {}
): string {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      ${baseUrl ? `<base href="${escapeHtml(baseUrl)}" />` : ''}
      ${title ? `<title>${escapeHtml(title)}</title>` : ''}
      <style>${INVOICE_FONT_CSS}</style>
      <style>${INVOICE_FONT_BASE_CSS}</style>
      <style>${pinInvoiceFonts(stripPageRules(css))}</style>
      <style>${PDF_RESET_CSS}</style>
    </head>
    <body>${pinInlineStyleFonts(innerHtml)}</body>
  </html>`
}

export function captureInvoiceHtml(
  node: HTMLElement | null,
  title?: string
): string {
  if (!node) {
    throw new Error('captureInvoiceHtml: nothing rendered to capture')
  }
  return buildStandaloneHtml(node.outerHTML, collectAppCss(), {
    title,
    baseUrl: `${window.location.origin}/`,
  })
}
