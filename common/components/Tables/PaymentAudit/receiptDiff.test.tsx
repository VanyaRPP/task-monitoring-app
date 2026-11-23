import { useRef, useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  clearDiffMarks,
  paintReceiptDiff,
  useReceiptDiffHighlight,
} from './receiptDiff'
import { GITHUB_DIFF_LIGHT } from './diffColors'

const COLORS = GITHUB_DIFF_LIGHT

const toRgb = (hex: string) => {
  const value = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((offset) =>
    parseInt(value.slice(offset, offset + 2), 16)
  )
  return `rgb(${r}, ${g}, ${b})`
}

const hosts: HTMLElement[] = []

const mount = (html: string): HTMLElement => {
  const host = document.createElement('div')
  host.innerHTML = html
  document.body.appendChild(host)
  hosts.push(host)
  return host
}

const paint = (beforeHtml: string, afterHtml: string) => {
  const before = mount(beforeHtml)
  const after = mount(afterHtml)
  paintReceiptDiff(before, after, COLORS)
  return { before, after }
}

const marked = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-audit-diff]')).map(
    (element) => element.textContent?.trim()
  )

afterEach(() => {
  hosts.splice(0).forEach((host) => host.remove())
})

describe('paintReceiptDiff', () => {
  it('leaves identical receipts untouched', () => {
    const html = '<div><span>Опалення</span><span>500.00</span></div>'
    const { before, after } = paint(html, html)

    expect(marked(before)).toEqual([])
    expect(marked(after)).toEqual([])
  })

  it('hugs the changed text instead of filling the whole cell', () => {
    const { before, after } = paint(
      '<table><tbody><tr><td>Опалення</td><td>500.00</td></tr></tbody></table>',
      '<table><tbody><tr><td>Опалення</td><td>600.00</td></tr></tbody></table>'
    )

    expect(marked(before)).toEqual(['500.00'])
    expect(marked(after)).toEqual(['600.00'])

    expect(before.querySelector('td[data-audit-diff]')).toBeNull()
    expect(after.querySelector('td[data-audit-diff]')).toBeNull()
    expect(
      Array.from(before.querySelectorAll('td')).every(
        (cell) => cell.style.backgroundColor === ''
      )
    ).toBe(true)

    const removed = before.querySelector<HTMLElement>('span[data-audit-diff]')
    const added = after.querySelector<HTMLElement>('span[data-audit-diff]')

    expect(removed?.textContent).toBe('500.00')
    expect(removed?.getAttribute('data-audit-diff-level')).toBe('word')
    expect(removed?.style.backgroundColor).toBe(toRgb(COLORS.before.word))
    expect(added?.textContent).toBe('600.00')
    expect(added?.getAttribute('data-audit-diff-level')).toBe('word')
    expect(added?.style.backgroundColor).toBe(toRgb(COLORS.after.word))

    expect(before.querySelectorAll('[data-audit-diff]')).toHaveLength(1)
  })

  it('neutralises template styling on the span it injects', () => {
    const { before } = paint(
      '<div class="row">500.00</div>',
      '<div class="row">600.00</div>'
    )

    const span = before.querySelector<HTMLElement>('span[data-audit-diff]')
    expect(span?.style.all).toBe('unset')
    expect(span?.style.backgroundColor).toBe(toRgb(COLORS.before.word))
  })

  it('paints an added row on the right and a removed row on the left', () => {
    const { before, after } = paint(
      '<table><tbody><tr><td>Опалення</td></tr></tbody></table>',
      '<table><tbody><tr><td>Опалення</td></tr><tr><td>Вода</td></tr></tbody></table>'
    )

    expect(marked(before)).toEqual([])
    expect(marked(after)).toEqual(['Вода'])

    const added = after.querySelector<HTMLElement>('[data-audit-diff]')
    expect(added?.getAttribute('data-audit-diff-level')).toBe('line')
    expect(added?.style.backgroundColor).toBe(toRgb(COLORS.after.line))
  })

  it('keeps a renamed row as one edited row instead of a delete plus insert', () => {
    const { before, after } = paint(
      '<table><tbody><tr class="row"><td>електрика(0)</td><td>3.00</td></tr></tbody></table>',
      '<table><tbody><tr class="row"><td>електрика(1)</td><td>4.00</td></tr></tbody></table>'
    )

    expect(marked(before)).toEqual(['електрика(0)', '3.00'])
    expect(marked(after)).toEqual(['електрика(1)', '4.00'])
  })

  it('wraps text that sits directly on an element next to a child tag', () => {
    const { before, after } = paint(
      '<div class="title"><b>РАХУНОК</b> № 12</div>',
      '<div class="title"><b>РАХУНОК</b> № 13</div>'
    )

    expect(
      before.querySelector('.title')?.hasAttribute('data-audit-diff')
    ).toBe(false)
    const removed = before.querySelector<HTMLElement>('span[data-audit-diff]')
    const added = after.querySelector<HTMLElement>('span[data-audit-diff]')

    expect(removed?.getAttribute('data-audit-diff')).toBe('before')
    expect(removed?.textContent?.trim()).toBe('№ 12')
    expect(added?.getAttribute('data-audit-diff')).toBe('after')
    expect(added?.textContent?.trim()).toBe('№ 13')

    expect(before.querySelector('b')?.hasAttribute('data-audit-diff')).toBe(
      false
    )
  })

  it('ignores whitespace-only differences', () => {
    const { before, after } = paint(
      '<div><span>Опалення</span></div>',
      '<div><span>  Опалення\n</span></div>'
    )

    expect(marked(before)).toEqual([])
    expect(marked(after)).toEqual([])
  })
})

describe('clearDiffMarks', () => {
  it('unwraps the injected spans and restores the original markup', () => {
    const source =
      '<table><tbody><tr><td>Опалення</td><td>500.00</td></tr></tbody></table>'
    const { before, after } = paint(
      source,
      '<table><tbody><tr><td>Опалення</td><td>600.00</td></tr></tbody></table>'
    )

    expect(marked(before)).toHaveLength(1)

    clearDiffMarks(before)
    clearDiffMarks(after)

    expect(marked(before)).toEqual([])
    expect(before.querySelectorAll('span')).toHaveLength(0)
    expect(before.innerHTML.replace(/ style=""/g, '')).toBe(source)
  })

  it('keeps the very same text node rather than recreating it', () => {
    const host = mount('<div><span>500.00</span></div>')
    const other = mount('<div><span>600.00</span></div>')
    const original = host.querySelector('span')?.firstChild

    paintReceiptDiff(host, other, COLORS)
    clearDiffMarks(host)
    clearDiffMarks(other)

    expect(original).toBeTruthy()
    expect(host.querySelector('span')?.firstChild).toBe(original)
  })
})

const Harness: React.FC<{ initialEnabled?: boolean }> = ({
  initialEnabled = true,
}) => {
  const beforeRef = useRef<HTMLDivElement>(null)
  const afterRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(initialEnabled)
  const [lateRow, setLateRow] = useState(false)

  useReceiptDiffHighlight(enabled, beforeRef, afterRef)

  return (
    <>
      <button onClick={() => setEnabled((value) => !value)}>toggle</button>
      <button onClick={() => setLateRow(true)}>load</button>
      <div ref={beforeRef}>
        <div className="sum">500.00</div>
        <div className="name">Опалення</div>
      </div>
      <div ref={afterRef}>
        <div className="sum">600.00</div>
        <div className="name">Опалення</div>
        {lateRow && <div className="name">Вода</div>}
      </div>
    </>
  )
}

const painted = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-audit-diff]')).map(
    (element) =>
      `${element.getAttribute('data-audit-diff')}:${element.textContent}`
  )

describe('useReceiptDiffHighlight', () => {
  it('paints the differing nodes on both sides', async () => {
    render(<Harness />)

    await waitFor(() =>
      expect(painted()).toEqual(['before:500.00', 'after:600.00'])
    )
  })

  it('does nothing while disabled and cleans up when switched off', async () => {
    render(<Harness initialEnabled={false} />)
    expect(painted()).toEqual([])

    fireEvent.click(screen.getByText('toggle'))
    await waitFor(() => expect(painted()).toHaveLength(2))

    fireEvent.click(screen.getByText('toggle'))
    await waitFor(() => expect(painted()).toEqual([]))
  })

  it('repaints when markup arrives after the first pass', async () => {
    render(<Harness />)
    await waitFor(() => expect(painted()).toHaveLength(2))

    await act(async () => {
      fireEvent.click(screen.getByText('load'))
    })

    await waitFor(() =>
      expect(painted()).toEqual(['before:500.00', 'after:600.00', 'after:Вода'])
    )
  })
})
