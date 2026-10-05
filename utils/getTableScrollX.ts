export interface ScrollXColumn {
  width?: number | string
  hidden?: boolean
  children?: readonly ScrollXColumn[]
}

/**
 * Sums the pixel widths of the columns that are actually rendered by an
 * antd Table, so `scroll.x` always matches the real column layout instead of
 * a hand-picked constant that can drift out of sync when column visibility
 * changes (e.g. via a `hidden` flag). Grouped columns (with `children`) don't
 * carry their own width in antd, so their leaf columns are summed instead.
 *
 * Passing `extraWidth` accounts for chrome antd adds outside of `columns`,
 * such as the row-selection checkbox column.
 */
export function getTableScrollX(
  columns: readonly ScrollXColumn[] | undefined | null,
  extraWidth = 0
): number {
  if (!columns?.length) return extraWidth

  const sum = columns.reduce((total, column) => {
    if (column?.hidden) return total

    if (column?.children?.length) {
      return total + getTableScrollX(column.children)
    }

    return total + (Number(column?.width) || 0)
  }, 0)

  return sum + extraWidth
}
