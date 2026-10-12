import { filterByRange, reconcileSources } from './reconcile'

describe('reconcileSources', () => {
  it('приймає місяць, на якому зійшлися два джерела', () => {
    const { agreed, mismatched } = reconcileSources([
      { name: 'minfin', items: [{ year: 2026, month: 9, value: 100.4 }] },
      { name: 'buhgalter', items: [{ year: 2026, month: 9, value: 100.4 }] },
    ])

    expect(agreed).toEqual([{ year: 2026, month: 9, value: 100.4 }])
    expect(mismatched).toEqual([])
  })

  it('порівнює з точністю до десятої: 100.4 і 100.40 — одне значення', () => {
    const { agreed } = reconcileSources([
      { name: 'a', items: [{ year: 2026, month: 9, value: 100.4 }] },
      { name: 'b', items: [{ year: 2026, month: 9, value: 100.40000001 }] },
    ])

    expect(agreed).toEqual([{ year: 2026, month: 9, value: 100.4 }])
  })

  it('не приймає місяць, у якому джерела розходяться', () => {
    const { agreed, mismatched } = reconcileSources([
      { name: 'minfin', items: [{ year: 2026, month: 9, value: 100.4 }] },
      { name: 'buhgalter', items: [{ year: 2026, month: 9, value: 100.5 }] },
    ])

    expect(agreed).toEqual([])
    expect(mismatched).toEqual([
      {
        year: 2026,
        month: 9,
        reason: 'conflict',
        values: [
          { source: 'minfin', value: 100.4 },
          { source: 'buhgalter', value: 100.5 },
        ],
      },
    ])
  })

  it('ловить зсув рядка: рік, що повторює дані попереднього', () => {
    const { agreed, mismatched } = reconcileSources([
      {
        name: 'good',
        items: [
          { year: 2025, month: 1, value: 101.2 },
          { year: 2025, month: 2, value: 100.8 },
        ],
      },
      {
        name: 'shifted',
        items: [
          { year: 2025, month: 1, value: 100.4 },
          { year: 2025, month: 2, value: 100.3 },
        ],
      },
    ])

    expect(agreed).toEqual([])
    expect(mismatched.map(({ reason }) => reason)).toEqual([
      'conflict',
      'conflict',
    ])
  })

  it('не приймає місяць, який є лише в одному джерелі', () => {
    const { agreed, mismatched } = reconcileSources([
      { name: 'minfin', items: [{ year: 2026, month: 9, value: 100.4 }] },
      { name: 'buhgalter', items: [] },
    ])

    expect(agreed).toEqual([])
    expect(mismatched).toEqual([
      {
        year: 2026,
        month: 9,
        reason: 'unconfirmed',
        values: [{ source: 'minfin', value: 100.4 }],
      },
    ])
  })

  it('два записи з одного джерела не рахуються як два джерела', () => {
    const { agreed, mismatched } = reconcileSources([
      {
        name: 'minfin',
        items: [
          { year: 2026, month: 9, value: 100.4 },
          { year: 2026, month: 9, value: 100.4 },
        ],
      },
    ])

    expect(agreed).toEqual([])
    expect(mismatched[0].reason).toBe('unconfirmed')
  })

  it('суперечність усередині одного джерела — теж конфлікт', () => {
    const { agreed, mismatched } = reconcileSources([
      {
        name: 'minfin',
        items: [
          { year: 2026, month: 9, value: 100.4 },
          { year: 2026, month: 9, value: 101.1 },
        ],
      },
      { name: 'buhgalter', items: [{ year: 2026, month: 9, value: 100.4 }] },
    ])

    expect(agreed).toEqual([])
    expect(mismatched[0].reason).toBe('conflict')
  })

  it('з трьох джерел одне незгодне блокує місяць', () => {
    const { agreed, mismatched } = reconcileSources([
      { name: 'a', items: [{ year: 2026, month: 9, value: 100.4 }] },
      { name: 'b', items: [{ year: 2026, month: 9, value: 100.4 }] },
      { name: 'c', items: [{ year: 2026, month: 9, value: 104.0 }] },
    ])

    expect(agreed).toEqual([])
    expect(mismatched[0].reason).toBe('conflict')
  })

  it('повертає місяці впорядкованими за періодом', () => {
    const { agreed } = reconcileSources([
      {
        name: 'a',
        items: [
          { year: 2026, month: 1, value: 100.7 },
          { year: 2025, month: 12, value: 100.2 },
        ],
      },
      {
        name: 'b',
        items: [
          { year: 2025, month: 12, value: 100.2 },
          { year: 2026, month: 1, value: 100.7 },
        ],
      },
    ])

    expect(agreed.map(({ year, month }) => `${year}-${month}`)).toEqual([
      '2025-12',
      '2026-1',
    ])
  })

  it('на порожньому вході нічого не повертає', () => {
    expect(reconcileSources([])).toEqual({ agreed: [], mismatched: [] })
  })
})

describe('filterByRange', () => {
  it('пропускає правдоподібні індекси, включно з межами', () => {
    const items = [
      { year: 2026, month: 1, value: 90 },
      { year: 2026, month: 2, value: 100.4 },
      { year: 2026, month: 3, value: 120 },
    ]

    expect(filterByRange(items)).toEqual({ valid: items, rejected: [] })
  })

  it('відкидає значення поза 90–120', () => {
    const { valid, rejected } = filterByRange([
      { year: 2026, month: 1, value: 1004 }, // dropped decimal comma
      { year: 2026, month: 2, value: 0.4 }, // change instead of index
      { year: 2026, month: 3, value: 89.9 },
      { year: 2026, month: 4, value: 120.1 },
      { year: 2026, month: 5, value: 100.4 },
    ])

    expect(valid).toEqual([{ year: 2026, month: 5, value: 100.4 }])
    expect(rejected.map(({ value }) => value)).toEqual([1004, 0.4, 89.9, 120.1])
  })

  it('відкидає NaN', () => {
    const { valid, rejected } = filterByRange([
      { year: 2026, month: 1, value: NaN },
    ])

    expect(valid).toEqual([])
    expect(rejected).toHaveLength(1)
  })
})
