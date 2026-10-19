import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useChatScroll } from './useChatScroll'

const ROW_HEIGHT = 100
const VIEWPORT = 300

/** jsdom has no layout: the test owns the scroll geometry. */
const layout = { rowHeight: ROW_HEIGHT, scrollTop: 0, rows: 0 }

const scrollHeight = (): number => layout.rows * layout.rowHeight

const fakeGeometry = (container: HTMLElement): void => {
  Object.defineProperties(container, {
    scrollHeight: { configurable: true, get: scrollHeight },
    clientHeight: { configurable: true, get: () => VIEWPORT },
    scrollTop: {
      configurable: true,
      get: () => layout.scrollTop,
      set: (value: number) => {
        layout.scrollTop = Math.max(
          0,
          Math.min(value, scrollHeight() - VIEWPORT)
        )
      },
    },
  })
}

const fakeRowGeometry = (row: HTMLElement, index: number): void => {
  Object.defineProperties(row, {
    offsetTop: { configurable: true, get: () => index * layout.rowHeight },
    offsetHeight: { configurable: true, get: () => layout.rowHeight },
  })
}

let resizeCallback: (() => void) | undefined
class ResizeObserverMock {
  constructor(callback: () => void) {
    resizeCallback = callback
  }
  observe = jest.fn()
  disconnect = jest.fn()
}

const Harness: React.FC<{ rows: number }> = ({ rows }) => {
  layout.rows = rows
  const scroll = useChatScroll({ enabled: true, contentKey: rows })
  return (
    <>
      <div
        data-testid="scroller"
        ref={(node) => {
          if (node) fakeGeometry(node)
          ;(
            scroll.containerRef as React.MutableRefObject<HTMLDivElement | null>
          ).current = node
        }}
        onScroll={scroll.onScroll}
      >
        <div ref={scroll.contentRef}>
          {Array.from({ length: rows }, (_, index) => (
            <div
              key={index}
              ref={(node) => node && fakeRowGeometry(node, index)}
            >
              {`row ${index}`}
            </div>
          ))}
        </div>
      </div>
      {scroll.isAwayFromBottom && (
        <button onClick={() => scroll.scrollToBottom()}>
          До останнього повідомлення
        </button>
      )}
    </>
  )
}

const scrollTo = (top: number): void => {
  const scroller = screen.getByTestId('scroller')
  scroller.scrollTop = top
  fireEvent.scroll(scroller)
}

const bottom = (): number => scrollHeight() - VIEWPORT

beforeEach(() => {
  layout.rowHeight = ROW_HEIGHT
  layout.scrollTop = 0
  resizeCallback = undefined
  ;(window as any).ResizeObserver = ResizeObserverMock
})

afterAll(() => {
  delete (window as any).ResizeObserver
})

describe('useChatScroll', () => {
  it('відкривається на останньому повідомленні', () => {
    render(<Harness rows={10} />)
    expect(layout.scrollTop).toBe(bottom())
  })

  it('прокручує до нового повідомлення, якщо користувач унизу', () => {
    const { rerender } = render(<Harness rows={10} />)

    rerender(<Harness rows={12} />)

    expect(layout.scrollTop).toBe(bottom())
  })

  it('не рухає історію, яку користувач переглядає', () => {
    const { rerender } = render(<Harness rows={10} />)
    scrollTo(200)

    rerender(<Harness rows={12} />)

    expect(layout.scrollTop).toBe(200)
  })

  it('показує кнопку «До останнього повідомлення» і повертає вниз', () => {
    render(<Harness rows={10} />)
    expect(
      screen.queryByRole('button', { name: 'До останнього повідомлення' })
    ).not.toBeInTheDocument()

    scrollTo(100)
    fireEvent.click(
      screen.getByRole('button', { name: 'До останнього повідомлення' })
    )

    expect(layout.scrollTop).toBe(bottom())
    expect(
      screen.queryByRole('button', { name: 'До останнього повідомлення' })
    ).not.toBeInTheDocument()
  })

  it('біля самого низу вважається «унизу» і далі стежить за відповіддю', () => {
    const { rerender } = render(<Harness rows={10} />)
    scrollTo(bottom() - 20)

    rerender(<Harness rows={11} />)

    expect(layout.scrollTop).toBe(bottom())
  })

  it('після resize лишає на місці повідомлення, яке читали', () => {
    render(<Harness rows={10} />)
    // Row 3 (top 300) is the first visible one, 20px above the viewport top.
    scrollTo(320)

    // Narrower window: every row gets taller.
    layout.rowHeight = 150
    act(() => resizeCallback?.())

    expect(layout.scrollTop).toBe(3 * 150 + 20)
  })

  it('після resize унизу лишається внизу', () => {
    render(<Harness rows={10} />)

    layout.rowHeight = 150
    act(() => resizeCallback?.())

    expect(layout.scrollTop).toBe(bottom())
  })
})
