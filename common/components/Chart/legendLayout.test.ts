import {
  CHART_SIZE,
  LAYOUT_GAP,
  getLegendColumnCount,
  getLegendLayout,
  getLegendWidth,
  isStackedLayout,
  splitIntoColumns,
} from './legendLayout'

describe('legendLayout', () => {
  describe('isStackedLayout / getLegendWidth', () => {
    test('An unmeasured container keeps the side by side layout', () => {
      expect(isStackedLayout(0)).toBe(false)
      expect(getLegendWidth(0)).toBe(0)
    })

    test('A narrow container puts the legend under the chart', () => {
      expect(isStackedLayout(400)).toBe(true)
      expect(getLegendWidth(400)).toBe(400)
    })

    test('A wide container gives the legend what is left next to the chart', () => {
      expect(isStackedLayout(1000)).toBe(false)
      expect(getLegendWidth(1000)).toBe(1000 - CHART_SIZE - LAYOUT_GAP)
    })
  })

  describe('getLegendColumnCount', () => {
    test('Uses up to three columns when the width is unknown', () => {
      expect(getLegendColumnCount(40, 0)).toBe(3)
    })

    test('Never uses more columns than there are companies', () => {
      expect(getLegendColumnCount(1, 800)).toBe(1)
      expect(getLegendColumnCount(2, 800)).toBe(2)
    })

    test('Depends on the available width', () => {
      expect(getLegendColumnCount(20, 656)).toBe(3)
      expect(getLegendColumnCount(20, 360)).toBe(2)
      expect(getLegendColumnCount(20, 120)).toBe(1)
    })
  })

  describe('splitIntoColumns', () => {
    test('Distributes the companies evenly and keeps their order', () => {
      const columns = splitIntoColumns([1, 2, 3, 4, 5, 6, 7], 3)

      expect(columns).toEqual([
        [1, 2, 3],
        [4, 5],
        [6, 7],
      ])
      const lengths = columns.map((c) => c.length)
      expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(1)
    })

    test('Does not create empty columns', () => {
      expect(splitIntoColumns(['a', 'b'], 3)).toEqual([['a'], ['b']])
      expect(splitIntoColumns([], 3)).toEqual([])
    })
  })

  describe('getLegendLayout', () => {
    test('A few companies fit without the toggle', () => {
      expect(
        getLegendLayout({ itemsCount: 6, columns: 3, expanded: false })
      ).toEqual({ hasOverflow: false, visibleCount: 6, hiddenCount: 0 })
    })

    test('Exactly the capacity of the block still fits', () => {
      // 320px / 28px = 11 rows
      expect(
        getLegendLayout({ itemsCount: 33, columns: 3, expanded: false })
          .hasOverflow
      ).toBe(false)
    })

    test('Too many companies are cut and the toggle row is reserved', () => {
      // (320 - 40) / 28 = 10 rows
      expect(
        getLegendLayout({ itemsCount: 50, columns: 3, expanded: false })
      ).toEqual({ hasOverflow: true, visibleCount: 30, hiddenCount: 20 })
    })

    test('The expanded list shows every company', () => {
      expect(
        getLegendLayout({ itemsCount: 50, columns: 3, expanded: true })
      ).toEqual({ hasOverflow: true, visibleCount: 50, hiddenCount: 0 })
    })
  })
})
