import {
  buildStandaloneHtml,
  captureInvoiceHtml,
  PDF_RESET_CSS,
} from './captureInvoiceHtml'

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
    const html = buildStandaloneHtml(
      '<div>x</div>',
      '',
      'ТОВ <Ромашка> & Co-inv-1'
    )

    expect(html).toContain('<title>ТОВ &lt;Ромашка&gt; &amp; Co-inv-1</title>')
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
  })
})
