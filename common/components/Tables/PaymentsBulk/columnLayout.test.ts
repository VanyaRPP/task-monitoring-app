import type { TableColumnsType } from 'antd'
import {
  applyColumnLayout,
  mergeOrder,
  moveColumn,
  toggleHidden,
} from './columnLayout'

const cols = [
  { fixed: 'left', title: 'Сума' },
  { fixed: 'left', title: 'Компанія' },
  { key: 'a', title: 'A' },
  { key: 'b', title: 'B' },
  { key: 'c', title: 'C' },
  { fixed: 'right', title: '' },
] as TableColumnsType

const titles = (c: TableColumnsType) => c.map((x) => x.title)

describe('column drag & drop order', () => {
  it('moveColumn moves the dragged column to the target position', () => {
    expect(moveColumn(['a', 'b', 'c'], 'a', 'c')).toEqual(['b', 'c', 'a'])
    expect(moveColumn(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b'])
  })

  it('moveColumn is a no-op for same/unknown keys', () => {
    const order = ['a', 'b']
    expect(moveColumn(order, 'a', 'a')).toBe(order)
    expect(moveColumn(order, 'a', 'x')).toBe(order)
  })

  it('applies the new order to the table while fixed columns stay in place', () => {
    const result = applyColumnLayout(cols, ['c', 'a', 'b'], [])
    expect(titles(result)).toEqual(['Сума', 'Компанія', 'C', 'A', 'B', ''])
  })

  it('mergeOrder keeps the user order, appends new and drops removed keys', () => {
    expect(mergeOrder(['c', 'a', 'gone'], ['a', 'b', 'c'])).toEqual([
      'c',
      'a',
      'b',
    ])
  })
})

describe('column hide / restore', () => {
  it('hides a column and restores it', () => {
    let hidden = toggleHidden([], 'b')
    expect(hidden).toEqual(['b'])
    expect(titles(applyColumnLayout(cols, ['a', 'b', 'c'], hidden))).toEqual([
      'Сума',
      'Компанія',
      'A',
      'C',
      '',
    ])

    hidden = toggleHidden(hidden, 'b')
    expect(hidden).toEqual([])
    expect(titles(applyColumnLayout(cols, ['a', 'b', 'c'], hidden))).toContain(
      'B'
    )
  })

  it('keeps the moved order after hiding and restoring', () => {
    const order = moveColumn(['a', 'b', 'c'], 'c', 'a')
    const hidden = toggleHidden([], 'a')
    expect(titles(applyColumnLayout(cols, order, hidden))).toEqual([
      'Сума',
      'Компанія',
      'C',
      'B',
      '',
    ])
    expect(titles(applyColumnLayout(cols, order, []))).toEqual([
      'Сума',
      'Компанія',
      'C',
      'A',
      'B',
      '',
    ])
  })

  it('never hides fixed columns', () => {
    expect(
      titles(applyColumnLayout(cols, ['a', 'b', 'c'], ['a', 'b', 'c']))
    ).toEqual(['Сума', 'Компанія', ''])
  })
})
