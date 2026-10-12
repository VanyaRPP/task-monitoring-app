export const CHART_SIZE = 320
export const LAYOUT_GAP = 24
export const LEGEND_ROW_HEIGHT = 28
export const LEGEND_TOGGLE_HEIGHT = 40
export const LEGEND_MIN_COLUMN_WIDTH = 160
export const LEGEND_MAX_COLUMNS = 3
export const STACK_BREAKPOINT = 600

export const isStackedLayout = (containerWidth: number) =>
  containerWidth > 0 && containerWidth < STACK_BREAKPOINT

export const getLegendWidth = (containerWidth: number) => {
  if (containerWidth <= 0) return 0
  return isStackedLayout(containerWidth)
    ? containerWidth
    : Math.max(containerWidth - CHART_SIZE - LAYOUT_GAP, 0)
}

export const getLegendColumnCount = (
  itemsCount: number,
  legendWidth: number
) => {
  if (itemsCount <= 1) return 1

  const byWidth =
    legendWidth > 0
      ? Math.floor(legendWidth / LEGEND_MIN_COLUMN_WIDTH)
      : LEGEND_MAX_COLUMNS

  return Math.max(1, Math.min(byWidth, LEGEND_MAX_COLUMNS, itemsCount))
}

export const splitIntoColumns = <T>(items: T[], columns: number): T[][] => {
  const count = Math.max(1, Math.min(columns, items.length))
  if (!items.length) return []

  const base = Math.floor(items.length / count)
  const extra = items.length % count
  const result: T[][] = []
  let start = 0

  for (let i = 0; i < count; i++) {
    const size = base + (i < extra ? 1 : 0)
    result.push(items.slice(start, start + size))
    start += size
  }

  return result
}

interface LegendLayoutParams {
  itemsCount: number
  columns: number
  expanded: boolean
  availableHeight?: number
}

export interface LegendLayout {
  hasOverflow: boolean
  visibleCount: number
  hiddenCount: number
}

export const getLegendLayout = ({
  itemsCount,
  columns,
  expanded,
  availableHeight = CHART_SIZE,
}: LegendLayoutParams): LegendLayout => {
  const safeColumns = Math.max(1, columns)
  const rowsWithoutToggle = Math.max(
    1,
    Math.floor(availableHeight / LEGEND_ROW_HEIGHT)
  )

  if (itemsCount <= rowsWithoutToggle * safeColumns) {
    return { hasOverflow: false, visibleCount: itemsCount, hiddenCount: 0 }
  }

  const collapsedRows = Math.max(
    1,
    Math.floor((availableHeight - LEGEND_TOGGLE_HEIGHT) / LEGEND_ROW_HEIGHT)
  )
  const collapsedCount = collapsedRows * safeColumns
  const visibleCount = expanded ? itemsCount : collapsedCount

  return {
    hasOverflow: true,
    visibleCount,
    hiddenCount: itemsCount - visibleCount,
  }
}
