import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ResizeHandles from './ResizeHandles'
import { ResizeEdge } from './geometry'
import { STORAGE_PREFIX, useFloatingWindow } from './useFloatingWindow'

class PointerEventPolyfill extends MouseEvent {
  public pointerId: number
  public isPrimary: boolean
  public pointerType: string

  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params)
    this.pointerId = params.pointerId ?? 1
    this.isPrimary = params.isPrimary ?? true
    this.pointerType = params.pointerType ?? 'mouse'
  }
}

beforeAll(() => {
  if (typeof window.PointerEvent === 'undefined') {
    // @ts-expect-error jsdom has no PointerEvent
    window.PointerEvent = PointerEventPolyfill
  }
})

const setViewport = (width: number, height: number): void => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  })
}

const Messages = React.memo(function Messages({
  onRender,
}: {
  onRender: () => void
}) {
  onRender()
  return <input aria-label="Повідомлення" />
})

interface HarnessProps {
  userKey?: string
  onMessagesRender?: () => void
}

const noop = (): void => undefined

const Harness: React.FC<HarnessProps> = ({
  userKey = 'u1',
  onMessagesRender = noop,
}) => {
  const w = useFloatingWindow({ userKey, bottomOffset: 144 })
  return (
    <div role="dialog" ref={w.windowRef} style={w.style}>
      {w.isFloating && !w.isMaximized && (
        <ResizeHandles onResizePointerDown={w.onResizePointerDown} />
      )}
      <div
        data-testid="header"
        onPointerDown={w.onHeaderPointerDown}
        onDoubleClick={w.onHeaderDoubleClick}
      >
        <span>AI Помічник</span>
        {w.isFloating && (
          <button onClick={w.toggleMaximize}>
            {w.isMaximized ? 'Відновити' : 'Розгорнути'}
          </button>
        )}
        <button onClick={w.reset}>Скинути</button>
      </div>
      <Messages onRender={onMessagesRender} />
    </div>
  )
}

const dialog = (): HTMLElement => screen.getByRole('dialog')

const rectOf = (element: HTMLElement) => ({
  x: parseFloat(element.style.left),
  y: parseFloat(element.style.top),
  width: parseFloat(element.style.width),
  height: parseFloat(element.style.height),
})

const handle = (edge: ResizeEdge): HTMLElement =>
  document.querySelector(`[data-resize-edge="${edge}"]`) as HTMLElement

/** Press on `target`, move the pointer by (dx, dy), optionally release. */
const gesture = (
  target: HTMLElement,
  dx: number,
  dy: number,
  release = true
): void => {
  fireEvent.pointerDown(target, { button: 0, clientX: 300, clientY: 300 })
  fireEvent.pointerMove(window, { clientX: 300 + dx, clientY: 300 + dy })
  if (release) fireEvent.pointerUp(window, { clientX: 300 + dx })
}

const storageKey = (user = 'u1'): string => `${STORAGE_PREFIX}:${user}`

// Default for 1600×1000 with a 144px bottom offset (see getDefaultRect).
const DEFAULT = { x: 1126, y: 256, width: 450, height: 600 }

beforeEach(() => {
  window.localStorage.clear()
  setViewport(1600, 1000)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
})

describe('useFloatingWindow', () => {
  it('відкривається 450×600 у правому нижньому куті', () => {
    render(<Harness />)
    expect(rectOf(dialog())).toEqual(DEFAULT)
  })

  describe('resize', () => {
    const CENTERED = { x: 500, y: 200, width: 450, height: 600 }

    it.each<[ResizeEdge, Partial<typeof CENTERED>]>([
      ['e', { width: 490 }],
      ['w', { x: 460, width: 490 }],
      ['s', { height: 640 }],
      ['n', { y: 160, height: 640 }],
      ['se', { width: 490, height: 640 }],
      ['sw', { x: 460, width: 490, height: 640 }],
      ['ne', { width: 490, y: 160, height: 640 }],
      ['nw', { x: 460, width: 490, y: 160, height: 640 }],
    ])('за %s', (edge, changed) => {
      window.localStorage.setItem(
        storageKey(),
        JSON.stringify({ rect: CENTERED, maximized: false })
      )
      render(<Harness />)
      // Pull outwards: right/bottom +40, left/top -40.
      const dx = edge.includes('e') ? 40 : edge.includes('w') ? -40 : 0
      const dy = edge.includes('s') ? 40 : edge.includes('n') ? -40 : 0

      gesture(handle(edge), dx, dy)

      expect(rectOf(dialog())).toEqual({ ...CENTERED, ...changed })
    })

    it('не менше 340×350 і не більше 90% viewport', () => {
      render(<Harness />)
      gesture(handle('nw'), 2000, 2000)
      expect(rectOf(dialog())).toMatchObject({ width: 340, height: 350 })

      gesture(screen.getByTestId('header'), -5000, -5000)
      gesture(handle('se'), 5000, 5000)
      expect(rectOf(dialog())).toMatchObject({ width: 1440, height: 900 })
    })

    it('курсор resize і заборона виділення тексту лише під час жесту', () => {
      render(<Harness />)
      gesture(handle('se'), -10, -10, false)
      expect(document.body.style.userSelect).toBe('none')
      expect(document.body.style.cursor).toBe('nwse-resize')

      fireEvent.pointerUp(window)
      expect(document.body.style.userSelect).toBe('')
      expect(document.body.style.cursor).toBe('')
    })
  })

  describe('drag', () => {
    it('тягне вікно за header', () => {
      render(<Harness />)
      gesture(screen.getByTestId('header'), -100, -50)
      expect(rectOf(dialog())).toEqual({ ...DEFAULT, x: 1026, y: 206 })
    })

    it('не випускає вікно за межі viewport', () => {
      render(<Harness />)
      gesture(screen.getByTestId('header'), -5000, -5000)
      expect(rectOf(dialog())).toMatchObject({ x: 8, y: 8 })

      gesture(screen.getByTestId('header'), 5000, 5000)
      expect(rectOf(dialog())).toMatchObject({ x: 1142, y: 392 })
    })

    it('кнопки header не запускають drag і лишаються клікабельними', async () => {
      render(<Harness />)
      gesture(screen.getByRole('button', { name: 'Розгорнути' }), -100, -100)
      expect(rectOf(dialog())).toEqual(DEFAULT)

      await userEvent.click(screen.getByRole('button', { name: 'Розгорнути' }))
      expect(screen.getByRole('button', { name: 'Відновити' })).toBeVisible()
    })

    it('права кнопка миші не тягне', () => {
      render(<Harness />)
      fireEvent.pointerDown(screen.getByTestId('header'), {
        button: 2,
        clientX: 300,
        clientY: 300,
      })
      fireEvent.pointerMove(window, { clientX: 100, clientY: 100 })
      expect(rectOf(dialog())).toEqual(DEFAULT)
    })

    it('поле введення працює, натискання в ньому не тягне вікно', async () => {
      render(<Harness />)
      const input = screen.getByRole('textbox', { name: 'Повідомлення' })
      gesture(input, -100, -100)
      await userEvent.type(input, 'привіт')

      expect(input).toHaveValue('привіт')
      expect(rectOf(dialog())).toEqual(DEFAULT)
    })

    it('повідомлення не перерендерюються, поки тягнуть вікно', () => {
      const onMessagesRender = jest.fn()
      render(<Harness onMessagesRender={onMessagesRender} />)
      onMessagesRender.mockClear()

      fireEvent.pointerDown(screen.getByTestId('header'), {
        button: 0,
        clientX: 300,
        clientY: 300,
      })
      for (let i = 1; i <= 20; i++) {
        fireEvent.pointerMove(window, { clientX: 300 - i, clientY: 300 - i })
      }
      fireEvent.pointerUp(window)

      expect(rectOf(dialog())).toMatchObject({ x: 1106, y: 236 })
      expect(onMessagesRender).not.toHaveBeenCalled()
    })
  })

  describe('збереження', () => {
    it('пише в localStorage лише після завершення жесту', () => {
      render(<Harness />)
      gesture(screen.getByTestId('header'), -100, -50, false)
      expect(window.localStorage.getItem(storageKey())).toBeNull()

      fireEvent.pointerUp(window)
      expect(JSON.parse(window.localStorage.getItem(storageKey()))).toEqual({
        rect: { ...DEFAULT, x: 1026, y: 206 },
        maximized: false,
      })
    })

    it('відновлює стан окремо для кожного користувача', () => {
      const { unmount } = render(<Harness userKey="u1" />)
      gesture(screen.getByTestId('header'), -100, -50)
      gesture(handle('e'), 20, 0)
      unmount()

      const first = render(<Harness userKey="u1" />)
      expect(rectOf(dialog())).toEqual({
        x: 1026,
        y: 206,
        width: 470,
        height: 600,
      })
      first.unmount()

      render(<Harness userKey="u2" />)
      expect(rectOf(dialog())).toEqual(DEFAULT)
    })

    it('збережене, що не влазить у viewport, коригується', () => {
      window.localStorage.setItem(
        storageKey(),
        JSON.stringify({
          rect: { x: 3000, y: 3000, width: 2500, height: 2000 },
          maximized: false,
        })
      )
      render(<Harness />)
      expect(rectOf(dialog())).toEqual({
        x: 152,
        y: 92,
        width: 1440,
        height: 900,
      })
    })

    it('зіпсовані дані ігноруються', () => {
      window.localStorage.setItem(storageKey(), '{not json')
      render(<Harness />)
      expect(rectOf(dialog())).toEqual(DEFAULT)
    })

    it('скидання повертає стандартні розмір і позицію', async () => {
      render(<Harness />)
      gesture(screen.getByTestId('header'), -300, -100)
      await userEvent.click(screen.getByRole('button', { name: 'Скинути' }))

      expect(rectOf(dialog())).toEqual(DEFAULT)
      expect(window.localStorage.getItem(storageKey())).toBeNull()
    })
  })

  describe('розгортання', () => {
    it('розгортає на 90% viewport і повертає попередній стан', async () => {
      render(<Harness />)
      gesture(screen.getByTestId('header'), -100, -50)
      const before = rectOf(dialog())

      await userEvent.click(screen.getByRole('button', { name: 'Розгорнути' }))
      expect(rectOf(dialog())).toEqual({
        x: 80,
        y: 50,
        width: 1440,
        height: 900,
      })
      expect(handle('se')).toBeNull()

      // Maximized: header drag is off.
      gesture(screen.getByTestId('header'), -30, -30)
      expect(rectOf(dialog())).toMatchObject({ x: 80, y: 50 })

      await userEvent.click(screen.getByRole('button', { name: 'Відновити' }))
      expect(rectOf(dialog())).toEqual(before)
      expect(handle('se')).not.toBeNull()
    })

    it('подвійний клік по header перемикає розгортання', async () => {
      render(<Harness />)
      await userEvent.dblClick(screen.getByText('AI Помічник'))
      expect(rectOf(dialog())).toMatchObject({ width: 1440, height: 900 })

      await userEvent.dblClick(screen.getByText('AI Помічник'))
      expect(rectOf(dialog())).toEqual(DEFAULT)
    })

    it('розгорнутий стан переживає перезавантаження', async () => {
      const { unmount } = render(<Harness />)
      await userEvent.click(screen.getByRole('button', { name: 'Розгорнути' }))
      unmount()

      render(<Harness />)
      expect(rectOf(dialog())).toMatchObject({ width: 1440, height: 900 })
      await userEvent.click(screen.getByRole('button', { name: 'Відновити' }))
      expect(rectOf(dialog())).toEqual(DEFAULT)
    })
  })

  describe('зміна viewport', () => {
    it('стискає вікно при зменшенні браузера і повертає при збільшенні', async () => {
      render(<Harness />)
      gesture(handle('nw'), -400, -200)
      const chosen = rectOf(dialog())
      expect(chosen).toMatchObject({ width: 850, height: 800 })

      act(() => {
        setViewport(900, 600)
        window.dispatchEvent(new Event('resize'))
      })
      await waitFor(() =>
        expect(rectOf(dialog())).toEqual({
          x: 82,
          y: 52,
          width: 810,
          height: 540,
        })
      )

      act(() => {
        setViewport(1600, 1000)
        window.dispatchEvent(new Event('resize'))
      })
      await waitFor(() => expect(rectOf(dialog())).toEqual(chosen))
    })

    it('на мобільному - адаптивне вікно без resize і drag', async () => {
      setViewport(400, 800)
      render(<Harness />)

      expect(dialog().style.left).toBe('')
      expect(handle('se')).toBeNull()
      expect(
        screen.queryByRole('button', { name: 'Розгорнути' })
      ).not.toBeInTheDocument()

      gesture(screen.getByTestId('header'), -50, -50)
      expect(dialog().style.left).toBe('')
    })
  })

  it('втрата фокусу вікном браузера завершує жест і зберігає стан', () => {
    render(<Harness />)
    gesture(screen.getByTestId('header'), -100, -50, false)

    fireEvent.blur(window)
    fireEvent.pointerMove(window, { clientX: 0, clientY: 0 })

    expect(rectOf(dialog())).toEqual({ ...DEFAULT, x: 1026, y: 206 })
    expect(document.body.style.userSelect).toBe('')
    expect(window.localStorage.getItem(storageKey())).not.toBeNull()
  })

  it('прибирає слухачі, якщо компонент зникає посеред жесту', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    const { unmount } = render(<Harness />)
    gesture(screen.getByTestId('header'), -10, -10, false)
    expect(document.body.style.userSelect).toBe('none')

    unmount()

    const removed = removeSpy.mock.calls.map(([type]) => type)
    expect(removed).toEqual(
      expect.arrayContaining(['pointermove', 'pointerup', 'pointercancel'])
    )
    expect(document.body.style.userSelect).toBe('')
    // A late move after unmount must not throw or write anywhere.
    expect(() =>
      fireEvent.pointerMove(window, { clientX: 0, clientY: 0 })
    ).not.toThrow()
    removeSpy.mockRestore()
  })
})
