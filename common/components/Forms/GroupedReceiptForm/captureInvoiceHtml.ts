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
  /* puppeteer's page.pdf() always sends Chrome explicit zero margins, so a CSS
     @page margin is dead in the download. Browser printing does honour it, and
     a different page box is a different layout width — the templates' own
     breakpoints then resolve differently and print drifts away from the
     download. Keep the page box identical to the one puppeteer prints on. */
  @page { size: A4; margin: 0; }
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function buildStandaloneHtml(
  innerHtml: string,
  css: string,
  title?: string
): string {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      ${title ? `<title>${escapeHtml(title)}</title>` : ''}
      <style>${css}</style>
      <style>${PDF_RESET_CSS}</style>
    </head>
    <body>${innerHtml}</body>
  </html>`
}

export function captureInvoiceHtml(
  node: HTMLElement | null,
  title?: string
): string {
  if (!node) {
    throw new Error('captureInvoiceHtml: nothing rendered to capture')
  }
  return buildStandaloneHtml(node.outerHTML, collectAppCss(), title)
}
