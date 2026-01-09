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
