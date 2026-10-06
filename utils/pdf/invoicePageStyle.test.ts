import { pinInvoiceFonts } from './invoicePageStyle'

const SANS = `'Invoice Sans'`
const SERIF = `'Invoice Serif', 'Invoice Sans'`
const MONO = `'Invoice Mono', 'Invoice Sans'`

describe('pinInvoiceFonts', () => {
  it.each([
    ["'Inter', 'Helvetica Neue', Arial, sans-serif", SANS],
    ['Arial, Helvetica, sans-serif', SANS],
    // antd's token stack — SF Pro on a Mac, missing on the server.
    ["-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", SANS],
    ["'Georgia', 'Times New Roman', serif", SERIF],
    ['serif', SERIF],
    ["'JetBrains Mono', 'Fira Code', 'Courier New', monospace", MONO],
    ['monospace', MONO],
    ['ui-monospace, Menlo', MONO],
  ])('maps %s to the bundled stack', (stack, pinned) => {
    expect(pinInvoiceFonts(`.a { font-family: ${stack}; }`)).toBe(
      `.a { font-family: ${pinned}; }`
    )
  })

  it('keeps !important', () => {
    expect(
      pinInvoiceFonts('body { font-family: Arial, sans-serif !important }')
    ).toBe(`body { font-family: ${SANS} !important}`)
  })

  it('leaves css-wide keywords and variables alone', () => {
    const css = '.a { font-family: inherit; } .b { font-family: var(--f); }'
    expect(pinInvoiceFonts(css)).toBe(css)
  })

  it('does not touch other properties', () => {
    const css = '.a { font-weight: 700; font-size: 12px; }'
    expect(pinInvoiceFonts(css)).toBe(css)
  })
})
