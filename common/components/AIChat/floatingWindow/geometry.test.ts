import {
  clampRect,
  DEFAULT_HEIGHT,
  DEFAULT_TOP_OFFSET,
  DEFAULT_WIDTH,
  getDefaultRect,
  getMaximizedRect,
  isMobileViewport,
  isWindowRect,
  IWindowRect,
  MIN_HEIGHT,
  MIN_WIDTH,
  moveRect,
  ResizeEdge,
  resizeRect,
  VIEWPORT_MARGIN,
} from './geometry'

const viewport = { width: 1600, height: 1000 }
const start: IWindowRect = { x: 500, y: 200, width: 450, height: 600 }

describe('resizeRect', () => {
  it.each<[ResizeEdge, number, number, IWindowRect]>([
    ['e', 50, 30, { x: 500, y: 200, width: 500, height: 600 }],
    ['w', -50, 30, { x: 450, y: 200, width: 500, height: 600 }],
    ['s', 30, 50, { x: 500, y: 200, width: 450, height: 650 }],
    ['n', 30, -50, { x: 500, y: 150, width: 450, height: 650 }],
    ['se', 50, 50, { x: 500, y: 200, width: 500, height: 650 }],
    ['sw', -50, 50, { x: 450, y: 200, width: 500, height: 650 }],
    ['ne', 50, -50, { x: 500, y: 150, width: 500, height: 650 }],
    ['nw', -50, -50, { x: 450, y: 150, width: 500, height: 650 }],
  ])('%s: змінює лише свої сторони', (edge, dx, dy, expected) => {
    expect(resizeRect(start, edge, dx, dy, viewport)).toEqual(expected)
  })

  it('не стискає нижче мінімуму, протилежна сторона лишається на місці', () => {
    const right = start.x + start.width
    const bottom = start.y + start.height
    const rect = resizeRect(start, 'nw', 1000, 1000, viewport)

    expect(rect.width).toBe(MIN_WIDTH)
    expect(rect.height).toBe(MIN_HEIGHT)
    expect(rect.x + rect.width).toBe(right)
    expect(rect.y + rect.height).toBe(bottom)
  })

  it('не більше 90% viewport', () => {
    const rect = resizeRect(
      { x: 10, y: 10, width: 450, height: 600 },
      'se',
      5000,
      5000,
      viewport
    )
    expect(rect.width).toBe(1440)
    expect(rect.height).toBe(900)
  })

  it('сторона не виходить за межі viewport', () => {
    const east = resizeRect(start, 'e', 5000, 0, viewport)
    expect(east.x + east.width).toBeLessThanOrEqual(
      viewport.width - VIEWPORT_MARGIN
    )

    const west = resizeRect(start, 'w', -5000, 0, viewport)
    expect(west.x).toBeGreaterThanOrEqual(VIEWPORT_MARGIN)

    const north = resizeRect(start, 'n', 0, -5000, viewport)
    expect(north.y).toBeGreaterThanOrEqual(VIEWPORT_MARGIN)
  })
})

describe('moveRect', () => {
  it('рухає без зміни розміру', () => {
    expect(moveRect(start, -100, 40, viewport)).toEqual({
      ...start,
      x: 400,
      y: 240,
    })
  })

  it('не випускає за межі viewport', () => {
    expect(moveRect(start, -5000, -5000, viewport)).toMatchObject({
      x: VIEWPORT_MARGIN,
      y: VIEWPORT_MARGIN,
    })
    expect(moveRect(start, 5000, 5000, viewport)).toMatchObject({
      x: viewport.width - start.width - VIEWPORT_MARGIN,
      y: viewport.height - start.height - VIEWPORT_MARGIN,
    })
  })
})

describe('clampRect', () => {
  it('вписує збережений стан у менший viewport', () => {
    const small = { width: 800, height: 500 }
    const rect = clampRect({ x: 1200, y: 700, width: 1000, height: 800 }, small)
    expect(rect.width).toBe(720)
    expect(rect.height).toBe(450)
    expect(rect.x + rect.width).toBeLessThanOrEqual(small.width)
    expect(rect.y + rect.height).toBeLessThanOrEqual(small.height)
  })

  it('на крихітному viewport viewport важливіший за мінімум', () => {
    const tiny = { width: 300, height: 300 }
    const rect = clampRect(start, tiny)
    expect(rect.x).toBeGreaterThanOrEqual(0)
    expect(rect.y).toBeGreaterThanOrEqual(0)
    expect(rect.x + rect.width).toBeLessThanOrEqual(tiny.width)
    expect(rect.y + rect.height).toBeLessThanOrEqual(tiny.height)
  })
})

describe('getDefaultRect / getMaximizedRect', () => {
  it('за замовчуванням 450×600 у правому нижньому куті над кнопками', () => {
    expect(getDefaultRect(viewport, 144)).toEqual({
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      x: viewport.width - DEFAULT_WIDTH - 24,
      y: viewport.height - DEFAULT_HEIGHT - 144,
    })
  })

  it('на низькому екрані стандартна висота зменшується', () => {
    // 700 - 144 (float buttons) - 80 (app header + gap)
    expect(getDefaultRect({ width: 1600, height: 700 }, 144).height).toBe(476)

    const rect = getDefaultRect({ width: 1600, height: 450 }, 144)
    expect(rect.height).toBe(MIN_HEIGHT)
    expect(rect.y).toBe(VIEWPORT_MARGIN)
  })

  it('стандартне вікно не заходить під шапку застосунку', () => {
    const rect = getDefaultRect({ width: 1440, height: 760 }, 144)
    expect(rect.y).toBeGreaterThanOrEqual(DEFAULT_TOP_OFFSET)
    expect(rect.y + rect.height).toBe(760 - 144)
  })

  it('розгорнуте вікно - 90% viewport по центру', () => {
    expect(getMaximizedRect(viewport)).toEqual({
      width: 1440,
      height: 900,
      x: 80,
      y: 50,
    })
  })
})

it('isMobileViewport', () => {
  expect(isMobileViewport({ width: 400, height: 800 })).toBe(true)
  expect(isMobileViewport({ width: 1024, height: 800 })).toBe(false)
})

it('isWindowRect відкидає зіпсовані дані', () => {
  expect(isWindowRect(start)).toBe(true)
  expect(isWindowRect(null)).toBe(false)
  expect(isWindowRect({ x: 1, y: 2, width: '3', height: 4 })).toBe(false)
  expect(isWindowRect({ x: NaN, y: 2, width: 3, height: 4 })).toBe(false)
})
