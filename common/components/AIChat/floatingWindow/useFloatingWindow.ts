import React, { useEffect, useRef, useState } from 'react'
import {
  clampRect,
  getDefaultRect,
  getMaximizedRect,
  isMobileViewport,
  isWindowRect,
  IViewport,
  IWindowRect,
  moveRect,
  ResizeEdge,
  resizeRect,
} from './geometry'

export const STORAGE_PREFIX = 'ai-chat-window'

export interface IStoredWindowState {
  rect: IWindowRect | null
  maximized: boolean
}

interface IUseFloatingWindowOptions {
  /** Per-user part of the localStorage key; nothing is stored without it. */
  userKey?: string
  /** Distance of the default window position from the viewport bottom. */
  bottomOffset: number
}

export interface IUseFloatingWindowResult {
  windowRef: React.RefObject<HTMLDivElement>
  /** False on mobile and before mount: the window keeps its CSS layout. */
  isFloating: boolean
  isMaximized: boolean
  style: React.CSSProperties | undefined
  onHeaderPointerDown: (event: React.PointerEvent<HTMLElement>) => void
  onHeaderDoubleClick: (event: React.MouseEvent<HTMLElement>) => void
  onResizePointerDown: (
    edge: ResizeEdge
  ) => (event: React.PointerEvent<HTMLElement>) => void
  toggleMaximize: () => void
  reset: () => void
}

const EDGE_CURSORS: Record<ResizeEdge, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
}

/** Header controls must stay clickable - they never start a drag. */
const NO_DRAG_SELECTOR = 'button, a, input, textarea, select, [data-no-drag]'

const readViewport = (): IViewport => ({
  width: window.innerWidth,
  height: window.innerHeight,
})

const getStorageKey = (userKey?: string): string | null =>
  userKey ? `${STORAGE_PREFIX}:${userKey}` : null

export const readStoredState = (key: string): IStoredWindowState | null => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? 'null')
    if (!parsed || typeof parsed !== 'object') return null
    return {
      rect: isWindowRect(parsed.rect) ? parsed.rect : null,
      maximized: parsed.maximized === true,
    }
  } catch {
    return null
  }
}

const writeStoredState = (
  key: string | null,
  state: IStoredWindowState
): void => {
  if (!key) return
  try {
    window.localStorage.setItem(key, JSON.stringify(state))
  } catch {
    // Storage full or blocked (private mode) - the window still works.
  }
}

const applyRect = (element: HTMLElement | null, rect: IWindowRect): void => {
  if (!element) return
  element.style.left = `${rect.x}px`
  element.style.top = `${rect.y}px`
  element.style.width = `${rect.width}px`
  element.style.height = `${rect.height}px`
}

/**
 * Drag, resize, maximize and per-user persistence of a floating window.
 *
 * While the pointer moves, the new geometry is written straight to the DOM
 * node - React state (and so the chat messages) is updated only once, when the
 * gesture ends. That is also the moment the geometry is saved.
 */
export const useFloatingWindow = ({
  userKey,
  bottomOffset,
}: IUseFloatingWindowOptions): IUseFloatingWindowResult => {
  const windowRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<IViewport | null>(null)
  const [rect, setRect] = useState<IWindowRect | null>(null)
  const [isMaximized, setIsMaximized] = useState(false)
  const stopGestureRef = useRef<(() => void) | null>(null)
  const storageKey = getStorageKey(userKey)

  useEffect(() => {
    let frame = 0
    const onResize = (): void => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setViewport(readViewport()))
    }
    setViewport(readViewport())
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useEffect(() => {
    const stored = storageKey ? readStoredState(storageKey) : null
    setRect(stored?.rect ?? null)
    setIsMaximized(stored?.maximized ?? false)
  }, [storageKey])

  // A gesture that outlives the component must not leak its listeners.
  useEffect(() => () => stopGestureRef.current?.(), [])

  const isFloating = !!viewport && !isMobileViewport(viewport)

  // The stored rect is what the user chose; what is shown is that rect fitted
  // into the current viewport. Growing the browser back restores the size.
  const displayRect: IWindowRect | null = !isFloating
    ? null
    : isMaximized
      ? getMaximizedRect(viewport)
      : clampRect(rect ?? getDefaultRect(viewport, bottomOffset), viewport)

  const startGesture = (
    event: React.PointerEvent<HTMLElement>,
    cursor: string,
    compute: (dx: number, dy: number) => IWindowRect
  ): void => {
    event.preventDefault()
    stopGestureRef.current?.()

    const startX = event.clientX
    const startY = event.clientY
    const element = windowRef.current
    const body = document.body
    const previousUserSelect = body.style.userSelect
    // Safari only honours the prefixed property.
    const previousWebkitUserSelect = body.style.getPropertyValue(
      '-webkit-user-select'
    )
    const previousCursor = body.style.cursor
    let latest: IWindowRect | null = null

    body.style.userSelect = 'none'
    body.style.setProperty('-webkit-user-select', 'none')
    body.style.cursor = cursor
    element?.setAttribute('data-interacting', 'true')

    const onMove = (moveEvent: PointerEvent): void => {
      latest = compute(moveEvent.clientX - startX, moveEvent.clientY - startY)
      applyRect(element, latest)
    }

    const stop = (): void => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
      window.removeEventListener('blur', onEnd)
      body.style.userSelect = previousUserSelect
      body.style.setProperty('-webkit-user-select', previousWebkitUserSelect)
      body.style.cursor = previousCursor
      element?.removeAttribute('data-interacting')
      stopGestureRef.current = null
    }

    function onEnd(): void {
      stop()
      if (!latest) return
      setRect(latest)
      writeStoredState(storageKey, { rect: latest, maximized: false })
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    // Released outside the browser (alt-tab, another window): no pointerup
    // arrives, so the window would stay stuck to the cursor.
    window.addEventListener('blur', onEnd)
    stopGestureRef.current = stop
  }

  const isPrimaryPress = (event: React.PointerEvent<HTMLElement>): boolean =>
    event.button === 0 && event.isPrimary !== false

  const onHeaderPointerDown = (
    event: React.PointerEvent<HTMLElement>
  ): void => {
    if (!displayRect || isMaximized || !isPrimaryPress(event)) return
    if ((event.target as HTMLElement).closest(NO_DRAG_SELECTOR)) return
    const start = displayRect
    const bounds = viewport
    startGesture(event, 'grabbing', (dx, dy) => moveRect(start, dx, dy, bounds))
  }

  const onResizePointerDown =
    (edge: ResizeEdge) =>
    (event: React.PointerEvent<HTMLElement>): void => {
      if (!displayRect || isMaximized || !isPrimaryPress(event)) return
      event.stopPropagation()
      const start = displayRect
      const bounds = viewport
      startGesture(event, EDGE_CURSORS[edge], (dx, dy) =>
        resizeRect(start, edge, dx, dy, bounds)
      )
    }

  // The stored rect stays the normal geometry, so un-maximizing (also after a
  // reload) returns the previous size and position.
  const toggleMaximize = (): void => {
    setIsMaximized(!isMaximized)
    writeStoredState(storageKey, { rect, maximized: !isMaximized })
  }

  const onHeaderDoubleClick = (event: React.MouseEvent<HTMLElement>): void => {
    if (!isFloating) return
    if ((event.target as HTMLElement).closest(NO_DRAG_SELECTOR)) return
    toggleMaximize()
  }

  const reset = (): void => {
    setRect(null)
    setIsMaximized(false)
    if (!storageKey) return
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // Nothing stored or storage blocked - the defaults apply either way.
    }
  }

  const style: React.CSSProperties | undefined = displayRect
    ? {
        left: displayRect.x,
        top: displayRect.y,
        width: displayRect.width,
        height: displayRect.height,
      }
    : undefined

  return {
    windowRef,
    isFloating,
    isMaximized,
    style,
    onHeaderPointerDown,
    onHeaderDoubleClick,
    onResizePointerDown,
    toggleMaximize,
    reset,
  }
}
