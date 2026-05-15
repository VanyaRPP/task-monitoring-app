import { renderPrice } from '@utils/helpers'

describe('renderPrice – dash behaviour for empty or invalid values', () => {
  it.each([
    null,
    undefined,
    NaN,
    Infinity,
    -Infinity,
    '100' as unknown as number,
    true as unknown as number,
    false as unknown as number,
    {} as unknown as number,
    [] as unknown as number,
  ])('returns dash for %p', (value) => {
    const result = renderPrice(value as number)
    expect(result).toBe('-')
    expect(result.trim()).toBe('-')
    expect(result).not.toBe('')
  })
})
describe('renderPrice – mixed column values', () => {
  it('renders number in first column and dash in second', () => {
    const firstColumnValue = 100
    const secondColumnValue = null

    expect(renderPrice(firstColumnValue)).toBe('100')
    expect(renderPrice(secondColumnValue)).toBe('-')
  })

  it('renders dash in first column and number in second', () => {
    const firstColumnValue = undefined
    const secondColumnValue = 250

    expect(renderPrice(firstColumnValue)).toBe('-')
    expect(renderPrice(secondColumnValue)).toBe('250')
  })
})
describe('renderPrice – array handling', () => {
  it('renders array of mixed values correctly', () => {
    const values = [100, null, undefined, 0, 50]

    const result = values.map(renderPrice)

    expect(result).toEqual(['100', '-', '-', '0', '50'])
  })
})
describe('renderPrice – matrix (rows & columns)', () => {
  it('renders table-like data correctly', () => {
    const tableData = [
      [100, null],
      [undefined, 200],
      [0, 300],
    ]

    const result = tableData.map((row) => row.map(renderPrice))

    expect(result).toEqual([
      ['100', '-'],
      ['-', '200'],
      ['0', '300'],
    ])
  })
})
describe('renderPrice – array with unexpected values', () => {
  it('handles unexpected values inside array', () => {
    const values = [100, '200', true, null, Infinity]

    const result = values.map(renderPrice)

    expect(result).toEqual(['100', '-', '-', '-', '-'])
  })
})
