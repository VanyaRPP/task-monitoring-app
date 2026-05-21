import { FC, useEffect, useRef } from 'react'
import { resolveBuiltinTemplateKey, templateMap } from './templateMap'
import { useReceiptTemplateProps } from './useReceiptTemplateProps'

interface Props {
  payment: any
  contextCompany?: any
  templateKey?: string
  captureDelayMs?: number
  onCapture: (html: string) => void
  onError?: (error: Error) => void
}

function collectAppCss(): string {
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

const PDF_RESET_CSS = `
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

function buildStandaloneHtml(innerHtml: string, css: string): string {
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

const HeadlessReceiptRenderer: FC<Props> = ({
  payment,
  contextCompany,
  templateKey,
  captureDelayMs = 800,
  onCapture,
  onError,
}) => {
  const componentRef = useRef<HTMLDivElement | null>(null)
  const capturedRef = useRef(false)

  const receiptProps = useReceiptTemplateProps({
    data: payment,
    contextCompany,
  })

  const resolvedKey = templateKey || resolveBuiltinTemplateKey(payment)
  const TemplateComponent = templateMap[resolvedKey] || templateMap.classic

  useEffect(() => {
    if (capturedRef.current) return

    const timer = window.setTimeout(() => {
      if (capturedRef.current) return
      try {
        const node = componentRef.current
        if (!node) {
          throw new Error(
            'HeadlessReceiptRenderer: nothing rendered to capture'
          )
        }
        const html = buildStandaloneHtml(node.outerHTML, collectAppCss())
        capturedRef.current = true
        onCapture(html)
      } catch (err) {
        capturedRef.current = true
        onError?.(err as Error)
      }
    }, captureDelayMs)

    return () => window.clearTimeout(timer)
  }, [captureDelayMs, onCapture, onError])

  const templateProps = {
    ...receiptProps,
    componentRef,
  }

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: '-10000px',
        top: 0,
        width: '860px',
        pointerEvents: 'none',
        opacity: 0,
      }}
    >
      <TemplateComponent {...templateProps} />
    </div>
  )
}

export default HeadlessReceiptRenderer
