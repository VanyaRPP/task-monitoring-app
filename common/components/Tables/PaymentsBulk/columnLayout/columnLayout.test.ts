import type { TableColumnsType } from 'antd'
import {
  applyColumnLayout,
  mergeOrder,
  moveColumn,
  pinEdgeColumns,
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

  it('mergeOrder keeps the user order, inserts new and drops removed keys', () => {
    expect(mergeOrder(['c', 'a', 'gone'], ['a', 'b', 'c'])).toEqual([
      'c',
      'a',
      'b',
    ])
  })

  it('mergeOrder puts a new key at its default place, not after «Сума»', () => {
    expect(
      mergeOrder(
        ['company', 'b', 'a', 'total'],
        ['company', 'a', 'b', 'x', 'total']
      )
    ).toEqual(['company', 'b', 'x', 'a', 'total'])
    expect(mergeOrder(['a', 'total'], ['company', 'a', 'total'])).toEqual([
      'company',
      'a',
      'total',
    ])
  })

  it('mergeOrder without saved order is the default order', () => {
    expect(mergeOrder([], ['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
  })
})

describe('pinEdgeColumns', () => {
  const pins = { company: 'left', total: 'right' } as const
  const layout = (...keys: string[]) =>
    [
      ...keys.map((key) => ({ key, title: key })),
      { fixed: 'right', title: '' },
    ] as TableColumnsType
  const fixedOf = (c: TableColumnsType) =>
    c.map((x) => [x.title, x.fixed ?? null])

  it('pins company left and total right while they stand on the edges', () => {
    expect(
      fixedOf(pinEdgeColumns(layout('company', 'a', 'total'), pins))
    ).toEqual([
      ['company', 'left'],
      ['a', null],
      ['total', 'right'],
      ['', 'right'],
    ])
  })

  it('does not pin a column dragged into the middle', () => {
    expect(
      fixedOf(pinEdgeColumns(layout('a', 'company', 'total', 'b'), pins))
    ).toEqual([
      ['a', null],
      ['company', null],
      ['total', null],
      ['b', null],
      ['', 'right'],
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
