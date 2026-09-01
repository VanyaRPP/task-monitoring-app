import { companyHasCustomService } from './companyHasCustomService'

describe('companyHasCustomService', () => {
  const target = { serviceKey: 'svc-1', fieldName: 'elektryka' }

  it('is true when a matching entry has a price set — including 0', () => {
    expect(companyHasCustomService([{ _id: 'svc-1', price: 15 }], target)).toBe(
      true
    )
    expect(companyHasCustomService([{ _id: 'svc-1', price: 0 }], target)).toBe(
      true
    )
  })

  it('is false when the matching entry has no price (undefined / null)', () => {
    expect(companyHasCustomService([{ _id: 'svc-1' }], target)).toBe(false)
    expect(
      companyHasCustomService([{ _id: 'svc-1', price: null }], target)
    ).toBe(false)
  })

  it('falls back to fieldName when the _id does not match', () => {
    expect(
      companyHasCustomService([{ fieldName: 'elektryka', price: 0 }], target)
    ).toBe(true)
  })

  it('does not let another meter with the same fieldName answer for this one', () => {
    // "електрика(0)" / "електрика(1)" transliterate to the same fieldName, so
    // only the _id can tell them apart.
    expect(
      companyHasCustomService(
        [{ _id: 'svc-2', fieldName: 'elektryka', price: 15 }],
        target
      )
    ).toBe(false)
  })

  it('prefers the _id match over a legacy fieldName entry', () => {
    expect(
      companyHasCustomService(
        [
          { fieldName: 'elektryka', price: 15 },
          { _id: 'svc-1', fieldName: 'elektryka', price: null },
        ],
        target
      )
    ).toBe(false)
  })

  it('is false when the company has a different service', () => {
    expect(
      companyHasCustomService(
        [{ _id: 'other', fieldName: 'voda', price: 9 }],
        target
      )
    ).toBe(false)
  })

  it('is false for empty / non-array company customServices', () => {
    expect(companyHasCustomService([], target)).toBe(false)
    expect(companyHasCustomService(undefined, target)).toBe(false)
    expect(companyHasCustomService(null, target)).toBe(false)
  })
})
