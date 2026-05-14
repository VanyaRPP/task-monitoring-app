export function collectAppCss(): string {
  const parts: string[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules
      if (!rules) continue
      for (const rule of Array.from(rules)) {
        parts.push(rule.cssText)
      }
    } catch {
      // CORS-restricted stylesheet — skip silently
    }
  }
  return parts.join('\n')
}

export const PDF_RESET_CSS = `
  html, body { margin: 0; padding: 0; height: auto; background: #fff; }
  *, *::before, *::after { box-sizing: border-box; }
  @page { size: A4; margin: 12mm 14mm; }
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

export function buildStandaloneHtml(innerHtml: string, css: string): string {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>${css}</style>
      <style>${PDF_RESET_CSS}</style>
    </head>
    <body>${innerHtml}</body>
  </html>`
}

export function snapshotNodeToStandaloneHtml(node: HTMLElement): string {
  return buildStandaloneHtml(node.outerHTML, collectAppCss())
}
