import { groupProfitByCategory } from './profit-categories'

const NONE = 'Без категорії'

describe('groupProfitByCategory', () => {
  it('merges the same category across records, ignoring case and spaces', () => {
    const groups = groupProfitByCategory(
      [
        {
          amount: 100,
          date: '2026-04-01',
          items: [{ category: 'Електрика', amount: 100 }],
        },
        {
          amount: 50.5,
          date: '2026-04-10',
          items: [{ category: ' електрика ', amount: 50.5 }],
        },
        {
          amount: 30,
          date: '2026-04-05',
          items: [{ category: 'Вода', amount: 30 }],
        },
      ],
      NONE
    )

    expect(groups.map((g) => [g.category, g.total, g.lines.length])).toEqual([
      ['Електрика', 150.5, 2],
      ['Вода', 30, 1],
    ])
    // newest line first
    expect(groups[0].lines.map((l) => l.record.date)).toEqual([
      '2026-04-10',
      '2026-04-01',
    ])
  })

  it('splits one receipt across its categories by line amount', () => {
    const groups = groupProfitByCategory(
      [
        {
          amount: 300,
          items: [
            { category: 'Майстри', amount: 200, description: 'Кран' },
            { category: 'Матеріали', amount: 100 },
          ],
        },
      ],
      NONE
    )

    expect(groups.map((g) => [g.category, g.total])).toEqual([
      ['Майстри', 200],
      ['Матеріали', 100],
    ])
    expect(groups[0].lines[0].description).toBe('Кран')
    expect(groups[0].share).toBeCloseTo(2 / 3)
  })

  it('never mixes currencies and computes shares within one', () => {
    const groups = groupProfitByCategory(
      [
        {
          amount: 100,
          currency: 'UAH',
          items: [{ category: 'Оренда', amount: 100 }],
        },
        {
          amount: 100,
          currency: 'USD',
          items: [{ category: 'Оренда', amount: 100 }],
        },
      ],
      NONE
    )

    expect(groups).toHaveLength(2)
    expect(groups.every((g) => g.share === 1)).toBe(true)
    expect(groups.map((g) => g.currency).sort()).toEqual(['UAH', 'USD'])
  })

  it('marks a legacy multi-category record as approximate', () => {
    const groups = groupProfitByCategory(
      [
        { amount: 100, categories: ['Вода', 'Електрика'] },
        { amount: 40, categories: ['Вода'] },
        { amount: 10 },
      ],
      NONE
    )
    const byName = Object.fromEntries(groups.map((g) => [g.category, g]))

    expect(byName['Вода'].total).toBe(90)
    expect(byName['Вода'].lines.map((l) => l.approximate).sort()).toEqual([
      false,
      true,
    ])
    expect(byName[NONE].total).toBe(10)
  })
})
