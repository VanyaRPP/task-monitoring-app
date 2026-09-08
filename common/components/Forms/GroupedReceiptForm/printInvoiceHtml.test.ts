import { PRINT_FRAME_ID, printInvoiceHtml } from './printInvoiceHtml'

const HTML = '<!DOCTYPE html><html><body><div>invoice</div></body></html>'

const getFrame = () =>
  document.getElementById(PRINT_FRAME_ID) as HTMLIFrameElement

const stubContentWindow = (
  frame: HTMLIFrameElement,
  { empty = false, print = jest.fn() } = {}
) => {
  const frameDocument = document.implementation.createHTMLDocument()
  if (!empty) frameDocument.body.appendChild(frameDocument.createElement('div'))

  Object.defineProperty(frame, 'contentWindow', {
    configurable: true,
    value: {
      document: frameDocument,
      focus: jest.fn(),
      print,
      addEventListener: jest.fn(),
    },
  })
  return print
}

const flushLoad = (options = {}) => {
  const frame = getFrame()
  const print = stubContentWindow(frame, options)
  frame.onload?.(new Event('load'))
  return { frame, print }
}

describe('printInvoiceHtml', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.title = 'E-ORENDA'
  })

  it('prints the exact html it was given', () => {
    printInvoiceHtml(HTML)

    expect(getFrame().srcdoc).toBe(HTML)

    const { print } = flushLoad()
    expect(print).toHaveBeenCalledTimes(1)
  })

  it('lays the frame out off-screen instead of collapsing it', () => {
    printInvoiceHtml(HTML)
    const frame = getFrame()

    expect(frame.getAttribute('aria-hidden')).toBe('true')
    expect(frame.style.visibility).toBe('')
    expect(Number(frame.width)).toBeGreaterThan(0)
    expect(Number(frame.height)).toBeGreaterThan(0)
    expect(frame.style.left.startsWith('-')).toBe(true)
    expect(frame.style.top.startsWith('-')).toBe(true)
  })

  it('ignores the load of the initial empty document', () => {
    printInvoiceHtml(HTML)

    const { print } = flushLoad({ empty: true })
    expect(print).not.toHaveBeenCalled()

    // The real srcdoc load still prints.
    const second = flushLoad()
    expect(second.print).toHaveBeenCalledTimes(1)
  })

  it('names the print job after the document title and restores it', () => {
    printInvoiceHtml(HTML, 'Acme-inv-01012501')

    const seen: string[] = []
    flushLoad({ print: jest.fn(() => seen.push(document.title)) })

    expect(seen).toEqual(['Acme-inv-01012501'])
    expect(document.title).toBe('E-ORENDA')
  })

  it('restores the title even when printing throws', () => {
    printInvoiceHtml(HTML, 'Acme-inv-01012501')

    flushLoad({
      print: jest.fn(() => {
        throw new Error('print blocked')
      }),
    })

    expect(document.title).toBe('E-ORENDA')
    expect(getFrame()).toBeNull()
  })

  it('replaces the frame left over from a previous print', () => {
    printInvoiceHtml(HTML)
    printInvoiceHtml(
      '<!DOCTYPE html><html><body><div>second</div></body></html>'
    )

    const frames = document.querySelectorAll(`#${PRINT_FRAME_ID}`)
    expect(frames).toHaveLength(1)
    expect((frames[0] as HTMLIFrameElement).srcdoc).toContain('second')
  })
})
