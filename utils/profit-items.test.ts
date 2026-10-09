import {
  itemsForEditing,
  normalizeProfitItems,
  splitProfitByCategory,
  sumProfitItems,
} from './profit-items'

describe('normalizeProfitItems', () => {
  it('derives amount and categories from the lines', () => {
    const result = normalizeProfitItems([
      { category: 'Прибирання', amount: 2600, description: '13 × 200' },
      { category: 'Корпоратив', amount: 3700, description: 'суші, піца' },
      { category: 'Прибирання', amount: 100 },
    ])

    expect(result).toEqual({
      ok: true,
      items: [
        { category: 'Прибирання', amount: 2600, description: '13 × 200' },
        { category: 'Корпоратив', amount: 3700, description: 'суші, піца' },
        { category: 'Прибирання', amount: 100 },
      ],
      amount: 6400,
      categories: ['Прибирання', 'Корпоратив'],
    })
  })

  it('adds kopecks without float drift', () => {
    const result = normalizeProfitItems([
      { category: 'A', amount: 0.1 },
      { category: 'B', amount: 0.2 },
    ])

    expect(result.ok && result.amount).toBe(0.3)
  })

  it('keeps a line without a category out of categories', () => {
    const result = normalizeProfitItems([{ amount: 145, category: '  ' }])

    expect(result).toMatchObject({
      ok: true,
      items: [{ amount: 145 }],
      categories: [],
    })
  })

  it.each([[[]], [null], ['x']])('rejects %p', (raw) => {
    expect(normalizeProfitItems(raw).ok).toBe(false)
  })

  it.each([[-2600], [0], ['abc'], [undefined]])(
    'rejects a line amount of %p',
    (amount) => {
      const result = normalizeProfitItems([{ category: 'A', amount }])
      expect(result).toEqual({
        ok: false,
        error: 'items[0].amount must be a positive number',
      })
    }
  )
})

describe('sumProfitItems', () => {
  it('skips lines without a number', () => {
    expect(
      sumProfitItems([{ amount: 300 }, { amount: undefined }, { amount: 500 }])
    ).toBe(800)
  })
})

describe('splitProfitByCategory', () => {
  it('uses each item amount', () => {
    expect(
      splitProfitByCategory(
        {
          amount: 3100,
          categories: ['Прибирання', 'Матеріали'],
          items: [
            { category: 'Прибирання', amount: 2600 },
            { category: 'Матеріали', amount: 500 },
          ],
        },
        'Без категорії'
      )
    ).toEqual([
      { category: 'Прибирання', amount: 2600 },
      { category: 'Матеріали', amount: 500 },
    ])
  })

  it('splits an older record evenly across its categories', () => {
    expect(
      splitProfitByCategory(
        { amount: 3100, categories: ['A', 'B'] },
        'Без категорії'
      )
    ).toEqual([
      { category: 'A', amount: 1550 },
      { category: 'B', amount: 1550 },
    ])
  })

  it('files lines and records without a category as uncategorized', () => {
    expect(
      splitProfitByCategory(
        { amount: 145, items: [{ amount: 145 }] },
        'Без категорії'
      )
    ).toEqual([{ category: 'Без категорії', amount: 145 }])
    expect(splitProfitByCategory({ amount: 10 }, 'Без категорії')).toEqual([
      { category: 'Без категорії', amount: 10 },
    ])
  })
})

describe('itemsForEditing', () => {
  it('copies existing lines', () => {
    const items = [{ category: 'A', amount: 1 }]
    expect(itemsForEditing({ amount: 1, items })).toEqual(items)
  })

  it('gives a single-category record its whole amount', () => {
    expect(itemsForEditing({ amount: 300, categories: ['Кава-чай'] })).toEqual([
      { category: 'Кава-чай', amount: 300 },
    ])
  })

  it('leaves the split of a multi-category record to the user', () => {
    expect(itemsForEditing({ amount: 3100, categories: ['A', 'B'] })).toEqual([
      { category: 'A' },
      { category: 'B' },
    ])
  })

  it('keeps an uncategorized record as one line', () => {
    expect(itemsForEditing({ amount: 50 })).toEqual([{ amount: 50 }])
  })
})
