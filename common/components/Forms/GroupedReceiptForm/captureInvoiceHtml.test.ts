import {
  buildStandaloneHtml,
  captureInvoiceHtml,
  PDF_RESET_CSS,
} from './captureInvoiceHtml'
import {
  INVOICE_FONT_CSS,
  INVOICE_PAGE_MARGIN,
} from '@utils/pdf/invoicePageStyle'

describe('buildStandaloneHtml', () => {
  it('puts PDF_RESET_CSS after the app css so its @page wins', () => {
    const html = buildStandaloneHtml('<div>x</div>', '@page { margin: 0; }')

    expect(html.indexOf('@page { margin: 0; }')).toBeLessThan(
      html.indexOf(PDF_RESET_CSS)
    )
  })

  it('omits the title element when no title is given', () => {
    expect(buildStandaloneHtml('<div>x</div>', '')).not.toContain('<title>')
  })

  it('escapes the document title', () => {
    const html = buildStandaloneHtml('<div>x</div>', '', {
      title: 'ТОВ <Ромашка> & Co-inv-1',
    })

    expect(html).toContain('<title>ТОВ &lt;Ромашка&gt; &amp; Co-inv-1</title>')
  })

  it('keeps the same A4 margins as the puppeteer download', () => {
    const { top, right, bottom, left } = INVOICE_PAGE_MARGIN

    expect(PDF_RESET_CSS).toContain(
      `@page { size: A4; margin: ${top} ${right} ${bottom} ${left}; }`
    )
  })

  it('pins app css and inline styles to the bundled invoice fonts', () => {
    const html = buildStandaloneHtml(
      '<div style="font-family: -apple-system, sans-serif; color: red">x</div>',
      '.ant-table { font-family: -apple-system, BlinkMacSystemFont, Roboto; }'
    )

    expect(html).toContain(INVOICE_FONT_CSS)
    expect(html).not.toMatch(/-apple-system|BlinkMacSystemFont|Roboto/)
    expect(html).toContain(`style="font-family: 'Invoice Sans'; color: red"`)
  })

  it('adds a base url so root-relative font urls resolve off-site', () => {
    expect(
      buildStandaloneHtml('<div>x</div>', '', {
        baseUrl: 'https://app.example/',
      })
    ).toContain('<base href="https://app.example/" />')
    expect(buildStandaloneHtml('<div>x</div>', '')).not.toContain('<base')
  })
})

describe('captureInvoiceHtml', () => {
  it('throws when there is nothing rendered', () => {
    expect(() => captureInvoiceHtml(null)).toThrow(
      'captureInvoiceHtml: nothing rendered to capture'
    )
  })

  it('captures the node markup into the standalone document', () => {
    const node = document.createElement('div')
    node.className = 'invoiceContainer'
    node.textContent = 'РАХУНОК'

    const html = captureInvoiceHtml(node, 'inv-1')

    expect(html).toContain('class="invoiceContainer"')
    expect(html).toContain('РАХУНОК')
    expect(html).toContain('<title>inv-1</title>')
    expect(html).toContain(PDF_RESET_CSS)
    expect(html).toContain(`<base href="${window.location.origin}/" />`)
  })
})
