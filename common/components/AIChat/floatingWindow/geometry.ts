/**
 * Pure geometry of the floating AI-chat window: sizes, clamping to the
 * viewport, drag and resize maths. No React, no DOM - easy to unit-test.
 */

export interface IWindowRect {
  x: number
  y: number
  width: number
  height: number
}

export interface IViewport {
  width: number
  height: number
}

/** Any combination of the four sides: 'e' is a side, 'se' is a corner. */
export type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export const RESIZE_EDGES: ResizeEdge[] = [
  'n',
  's',
  'e',
  'w',
  'ne',
  'nw',
  'se',
  'sw',
]

export const MIN_WIDTH = 340
export const MIN_HEIGHT = 350
export const DEFAULT_WIDTH = 450
export const DEFAULT_HEIGHT = 600
/** Share of the viewport the window may take at most (90vw / 90dvh). */
export const MAX_VIEWPORT_SHARE = 0.9
/** Gap kept between the window and the viewport edges. */
export const VIEWPORT_MARGIN = 8
/** Antd `Layout.Header` (64px) + a gap - the default window stays below it. */
export const DEFAULT_TOP_OFFSET = 64 + 16
/** Below this width the window is a fixed adaptive sheet (no drag/resize). */
export const MOBILE_BREAKPOINT = 576

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max))

export const isMobileViewport = (viewport: IViewport): boolean =>
  viewport.width <= MOBILE_BREAKPOINT

interface ISizeLimits {
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
}

/**
 * On a tiny viewport the minimum size can't fit - the viewport wins, so the
 * header and the input never leave the screen.
 */
export const getSizeLimits = (viewport: IViewport): ISizeLimits => {
  const fitWidth = viewport.width - VIEWPORT_MARGIN * 2
  const fitHeight = viewport.height - VIEWPORT_MARGIN * 2
  const maxWidth = Math.min(viewport.width * MAX_VIEWPORT_SHARE, fitWidth)
  const maxHeight = Math.min(viewport.height * MAX_VIEWPORT_SHARE, fitHeight)
  return {
    minWidth: Math.min(MIN_WIDTH, maxWidth),
    minHeight: Math.min(MIN_HEIGHT, maxHeight),
    maxWidth,
    maxHeight,
  }
}

/** Fits a rect into the size limits first, then moves it inside the viewport. */
export const clampRect = (
  rect: IWindowRect,
  viewport: IViewport
): IWindowRect => {
  const limits = getSizeLimits(viewport)
  const width = clamp(rect.width, limits.minWidth, limits.maxWidth)
  const height = clamp(rect.height, limits.minHeight, limits.maxHeight)
  return {
    width,
    height,
    x: clamp(rect.x, VIEWPORT_MARGIN, viewport.width - width - VIEWPORT_MARGIN),
    y: clamp(
      rect.y,
      VIEWPORT_MARGIN,
      viewport.height - height - VIEWPORT_MARGIN
    ),
  }
}

/**
 * Default place: bottom-right corner, above the floating buttons
 * (`bottomOffset` is the distance from the viewport bottom) and below the
 * app header (`topOffset`). The user may still drag/resize over the header.
 */
export const getDefaultRect = (
  viewport: IViewport,
  bottomOffset: number,
  topOffset = DEFAULT_TOP_OFFSET,
  rightOffset = 24
): IWindowRect => {
  const limits = getSizeLimits(viewport)
  const width = clamp(DEFAULT_WIDTH, limits.minWidth, limits.maxWidth)
  const height = clamp(
    Math.min(DEFAULT_HEIGHT, viewport.height - bottomOffset - topOffset),
    limits.minHeight,
    limits.maxHeight
  )
  return clampRect(
    {
      width,
      height,
      x: viewport.width - width - rightOffset,
      y: viewport.height - height - bottomOffset,
    },
    viewport
  )
}

/** The largest the window may get: 90% of the viewport, centred. */
export const getMaximizedRect = (viewport: IViewport): IWindowRect => {
  const { maxWidth, maxHeight } = getSizeLimits(viewport)
  return {
    width: maxWidth,
    height: maxHeight,
    x: (viewport.width - maxWidth) / 2,
    y: (viewport.height - maxHeight) / 2,
  }
}

export const moveRect = (
  start: IWindowRect,
  dx: number,
  dy: number,
  viewport: IViewport
): IWindowRect =>
  clampRect({ ...start, x: start.x + dx, y: start.y + dy }, viewport)

/**
 * Resizes from one side or corner. The opposite side stays put: dragging the
 * left edge keeps the right edge where it was, and a side never crosses the
 * viewport edge.
 */
export const resizeRect = (
  start: IWindowRect,
  edge: ResizeEdge,
  dx: number,
  dy: number,
  viewport: IViewport
): IWindowRect => {
  const limits = getSizeLimits(viewport)
  const right = start.x + start.width
  const bottom = start.y + start.height
  let { x, y, width, height } = start

  if (edge.includes('e')) {
    width = clamp(
      start.width + dx,
      limits.minWidth,
      Math.min(limits.maxWidth, viewport.width - VIEWPORT_MARGIN - start.x)
    )
  } else if (edge.includes('w')) {
    width = clamp(
      start.width - dx,
      limits.minWidth,
      Math.min(limits.maxWidth, right - VIEWPORT_MARGIN)
    )
    x = right - width
  }

  if (edge.includes('s')) {
    height = clamp(
      start.height + dy,
      limits.minHeight,
      Math.min(limits.maxHeight, viewport.height - VIEWPORT_MARGIN - start.y)
    )
  } else if (edge.includes('n')) {
    height = clamp(
      start.height - dy,
      limits.minHeight,
      Math.min(limits.maxHeight, bottom - VIEWPORT_MARGIN)
    )
    y = bottom - height
  }

  return { x, y, width, height }
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/** Guards whatever came out of localStorage. */
export const isWindowRect = (value: unknown): value is IWindowRect => {
  if (!value || typeof value !== 'object') return false
  const rect = value as Record<string, unknown>
  return (
    isFiniteNumber(rect.x) &&
    isFiniteNumber(rect.y) &&
    isFiniteNumber(rect.width) &&
    isFiniteNumber(rect.height)
  )
}
