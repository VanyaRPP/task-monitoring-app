import {
  excludeCompany,
  getActiveRows,
  getCompanyState,
  getRentPart,
  getTotalArea,
  getTotalRentPart,
  hasRecalculationChanges,
  includeCompany,
  pinCompanyArea,
  recalculateAreaShares,
  redistributeShares,
  resolveActualArea,
  unpinCompanyArea,
} from './areaRecalc'

describe('resolveActualArea', () => {
  it('takes the area from the matching real estate record', () => {
    const area = resolveActualArea(
      { _id: 'r1', name: 'Company A', area: 5 },
      { realEstates: [{ _id: 'r1', companyName: 'Company A', totalArea: 42 }] }
    )
    expect(area).toBe(42)
  })

  it('matches by company name when the row has no _id', () => {
    const area = resolveActualArea(
      { name: 'Company B', area: 5 },
      { realEstates: [{ _id: 'r2', companyName: 'Company B', totalArea: 17 }] }
    )
    expect(area).toBe(17)
  })

  it('falls back to the domain areas response when no real estate matches', () => {
    const area = resolveActualArea(
      { _id: 'r1', name: 'Company A', area: 5 },
      {
        realEstates: [
          { _id: 'other', companyName: 'Company Z', totalArea: 99 },
        ],
        companies: [{ companyName: 'Company A', totalArea: 33 }],
      }
    )
    expect(area).toBe(33)
  })

  it('ignores sources that carry no area at all', () => {
    const area = resolveActualArea(
      { _id: 'r1', name: 'Company A', area: 5 },
      {
        realEstates: [{ _id: 'r1', companyName: 'Company A' }],
        companies: [{ companyName: 'Company A', totalArea: 12 }],
      }
    )
    expect(area).toBe(12)
  })

  it('keeps the current row area when the company cannot be matched', () => {
    expect(
      resolveActualArea({ _id: 'r1', name: 'Company A', area: 7.5 }, {})
    ).toBe(7.5)
  })

  it('treats a non numeric area as 0', () => {
    expect(resolveActualArea({ name: 'Company A', area: undefined }, {})).toBe(
      0
    )
  })
})

describe('getRentPart', () => {
  it('returns the share of the total in percent', () => {
    expect(getRentPart(25, 100)).toBe(25)
  })

  it('returns 0 when the total area is 0', () => {
    expect(getRentPart(0, 0)).toBe(0)
  })
})

describe('getTotalArea / getTotalRentPart', () => {
  it('sums areas and shares', () => {
    const rows = [
      { area: 10.5, rentPart: 30 },
      { area: 4.5, rentPart: 70 },
    ]
    expect(getTotalArea(rows)).toBe(15)
    expect(getTotalRentPart(rows)).toBe(100)
  })

  it('skips values that are not numbers', () => {
    expect(getTotalArea([{ area: 10 }, { area: undefined }])).toBe(10)
    expect(getTotalRentPart([{ rentPart: 10 }, {}])).toBe(10)
  })
})

describe('recalculateAreaShares', () => {
  const rows = [
    { _id: 'r1', name: 'Company A', area: 10, rentPart: 50 },
    { _id: 'r2', name: 'Company B', area: 10, rentPart: 50 },
  ]

  it('uses the actual company areas, not the ones held in the form', () => {
    const result = recalculateAreaShares(rows, {
      realEstates: [
        { _id: 'r1', companyName: 'Company A', totalArea: 30 },
        { _id: 'r2', companyName: 'Company B', totalArea: 10 },
      ],
    })

    expect(result.map((r) => r.area)).toEqual([30, 10])
    expect(getTotalArea(result)).toBe(40)
  })

  it('recomputes the share of every company against the actual total', () => {
    const result = recalculateAreaShares(rows, {
      realEstates: [
        { _id: 'r1', companyName: 'Company A', totalArea: 30 },
        { _id: 'r2', companyName: 'Company B', totalArea: 10 },
      ],
    })

    expect(result.map((r) => r.rentPart)).toEqual([75, 25])
  })

  it('reacts to a change of a single company area', () => {
    const first = recalculateAreaShares(rows, {
      companies: [
        { companyName: 'Company A', totalArea: 10 },
        { companyName: 'Company B', totalArea: 10 },
      ],
    })
    expect(first.map((r) => r.rentPart)).toEqual([50, 50])

    const second = recalculateAreaShares(rows, {
      companies: [
        { companyName: 'Company A', totalArea: 10 },
        { companyName: 'Company B', totalArea: 30 },
      ],
    })
    expect(second.map((r) => r.rentPart)).toEqual([25, 75])
  })

  it('gives every company a 0 share when the total area is 0', () => {
    const result = recalculateAreaShares(
      [
        { name: 'A', area: 0 },
        { name: 'B', area: 0 },
      ],
      {}
    )

    expect(getTotalArea(result)).toBe(0)
    expect(result.map((r) => r.rentPart)).toEqual([0, 0])
  })

  it('gives the only company a 100% share', () => {
    const result = recalculateAreaShares([{ name: 'A', area: 12.34 }], {})
    expect(result).toEqual([{ name: 'A', area: 12.34, rentPart: 100 }])
  })

  it('handles fractional areas', () => {
    const result = recalculateAreaShares(
      [
        { name: 'A', area: 12.5 },
        { name: 'B', area: 37.5 },
      ],
      {}
    )

    expect(getTotalArea(result)).toBe(50)
    expect(result.map((r) => r.rentPart)).toEqual([25, 75])
  })

  it('keeps the rest of the row untouched', () => {
    const result = recalculateAreaShares(
      [
        {
          _id: 'r1',
          name: 'Company A',
          key: 'r1',
          area: 10,
          rentPart: 50,
          _initialArea: 10,
          _initialRentPart: 50,
        },
      ],
      {}
    )

    expect(result[0]).toMatchObject({
      _id: 'r1',
      name: 'Company A',
      key: 'r1',
      _initialArea: 10,
      _initialRentPart: 50,
    })
  })

  it('returns an empty list for missing rows', () => {
    expect(recalculateAreaShares(undefined, {})).toEqual([])
    expect(recalculateAreaShares(null, {})).toEqual([])
  })
})

describe('hasRecalculationChanges', () => {
  it('is false when nothing moved', () => {
    const rows = [
      { area: 10, rentPart: 50 },
      { area: 10, rentPart: 50 },
    ]
    expect(hasRecalculationChanges(rows, recalculateAreaShares(rows, {}))).toBe(
      false
    )
  })

  it('is true when a share was corrected', () => {
    const rows = [
      { area: 10, rentPart: 90 },
      { area: 10, rentPart: 10 },
    ]
    expect(hasRecalculationChanges(rows, recalculateAreaShares(rows, {}))).toBe(
      true
    )
  })
})

describe('company states', () => {
  const rows = [
    { _id: 'r1', name: 'A', area: 10, rentPart: 50 },
    { _id: 'r2', name: 'B', area: 10, rentPart: 50 },
    { _id: 'r3', name: 'C', area: 20, rentPart: 0 },
  ]

  const sources = {
    realEstates: [
      { _id: 'r1', companyName: 'A', totalArea: 10 },
      { _id: 'r2', companyName: 'B', totalArea: 10 },
      { _id: 'r3', companyName: 'C', totalArea: 20 },
    ],
  }

  describe('getCompanyState', () => {
    it('reads the state of a row', () => {
      expect(getCompanyState({ name: 'A' })).toBe('normal')
      expect(getCompanyState({ name: 'A', _pinned: true })).toBe('pinned')
      expect(getCompanyState({ name: 'A', _excluded: true })).toBe('excluded')
    })

    it('reports an excluded company as excluded even when pinned', () => {
      expect(
        getCompanyState({ name: 'A', _pinned: true, _excluded: true })
      ).toBe('excluded')
    })
  })

  describe('excludeCompany', () => {
    it('keeps the company in the list', () => {
      const result = excludeCompany(rows, 2)
      expect(result).toHaveLength(3)
      expect(result[2]).toMatchObject({ _id: 'r3', name: 'C' })
    })

    it('leaves the excluded company data untouched', () => {
      const result = excludeCompany(rows, 0)
      expect(result[0]).toMatchObject({ area: 10, rentPart: 50 })
    })

    it('drops it out of the total area', () => {
      expect(getTotalArea(getActiveRows(excludeCompany(rows, 2)))).toBe(20)
    })

    it('spreads its share over the companies that are left', () => {
      const result = excludeCompany(rows, 2)
      expect(result[0].rentPart).toBe(50)
      expect(result[1].rentPart).toBe(50)

      const withoutB = excludeCompany(rows, 1)
      expect(withoutB[0].rentPart).toBeCloseTo(33.33, 1)
      expect(withoutB[2].rentPart).toBeCloseTo(66.67, 1)
    })
  })

  describe('includeCompany', () => {
    it('brings the company back into the calculation', () => {
      const excluded = excludeCompany(rows, 2)
      const restored = includeCompany(excluded, 2)

      expect(getCompanyState(restored[2])).toBe('normal')
      expect(getTotalArea(getActiveRows(restored))).toBe(40)
      expect(restored.map((r) => r.rentPart)).toEqual([25, 25, 50])
    })

    it('keeps the pinned values of the other companies', () => {
      const prepared = pinCompanyArea(excludeCompany(rows, 2), 0)
      const restored = includeCompany(prepared, 2)

      expect(getCompanyState(restored[0])).toBe('pinned')
      expect(restored[0].area).toBe(10)
      expect(restored.map((r) => r.rentPart)).toEqual([25, 25, 50])
    })

    it('returns a company pinned before its exclusion to the pinned state', () => {
      const prepared = excludeCompany(pinCompanyArea(rows, 0), 0)
      expect(getCompanyState(prepared[0])).toBe('excluded')
      expect(getCompanyState(includeCompany(prepared, 0)[0])).toBe('pinned')
    })
  })

  describe('pinCompanyArea', () => {
    it('marks only the chosen company', () => {
      const result = pinCompanyArea(rows, 1)
      expect(result.map(getCompanyState)).toEqual([
        'normal',
        'pinned',
        'normal',
      ])
    })

    it('spreads the shares using the confirmed value', () => {
      const typed = rows.map((r, i) => (i === 0 ? { ...r, area: 20 } : r))
      const result = pinCompanyArea(typed, 0)

      expect(getTotalArea(getActiveRows(result))).toBe(50)
      expect(result.map((r) => r.rentPart)).toEqual([40, 20, 40])
    })

    it('protects the confirmed value from a recalculation', () => {
      const typed = rows.map((r, i) => (i === 0 ? { ...r, area: 99 } : r))
      const result = recalculateAreaShares(pinCompanyArea(typed, 0), sources)

      expect(result.map((r) => r.area)).toEqual([99, 10, 20])
    })

    it('does not touch the areas of the other companies', () => {
      const typed = rows.map((r, i) => (i === 0 ? { ...r, area: 20 } : r))
      expect(pinCompanyArea(typed, 0).map((r) => r.area)).toEqual([20, 10, 20])
    })
  })

  describe('unpinCompanyArea', () => {
    it('goes back to the standard way of getting the value', () => {
      const typed = rows.map((r, i) => (i === 0 ? { ...r, area: 99 } : r))
      const released = unpinCompanyArea(pinCompanyArea(typed, 0), 0, sources)

      expect(getCompanyState(released[0])).toBe('normal')
      expect(released[0].area).toBe(10)
      expect(getTotalArea(getActiveRows(released))).toBe(40)
      expect(released.map((r) => r.rentPart)).toEqual([25, 25, 50])
    })

    it('keeps the typed value when the company cannot be matched', () => {
      const pinned = pinCompanyArea([{ name: 'Unknown', area: 12 }], 0)
      expect(unpinCompanyArea(pinned, 0, sources)[0].area).toBe(12)
    })

    it('leaves the other companies alone', () => {
      const prepared = pinCompanyArea(pinCompanyArea(rows, 0), 1)
      const released = unpinCompanyArea(prepared, 0, sources)

      expect(released.map(getCompanyState)).toEqual([
        'normal',
        'pinned',
        'normal',
      ])
    })
  })

  describe('combinations', () => {
    it('handles one company excluded and another pinned', () => {
      const typed = rows.map((r, i) => (i === 0 ? { ...r, area: 30 } : r))
      const result = excludeCompany(pinCompanyArea(typed, 0), 2)

      expect(result.map(getCompanyState)).toEqual([
        'pinned',
        'normal',
        'excluded',
      ])
      expect(getTotalArea(getActiveRows(result))).toBe(40)
      expect(result[0].rentPart).toBe(75)
      expect(result[1].rentPart).toBe(25)
      expect(getTotalRentPart(getActiveRows(result))).toBe(100)
    })

    it('stays correct over a sequence of actions', () => {
      let state = excludeCompany(rows, 2)
      expect(getTotalArea(getActiveRows(state))).toBe(20)

      state = pinCompanyArea(
        state.map((r, i) => (i === 0 ? { ...r, area: 30 } : r)),
        0
      )
      expect(getTotalArea(getActiveRows(state))).toBe(40)
      expect(state.map((r) => r.rentPart)).toEqual([75, 25, 0])

      state = includeCompany(state, 2)
      expect(getTotalArea(getActiveRows(state))).toBe(60)
      expect(state[0].rentPart).toBe(50)
      expect(state[1].rentPart).toBeCloseTo(16.67, 2)
      expect(state[2].rentPart).toBeCloseTo(33.33, 2)

      state = unpinCompanyArea(state, 0, sources)
      expect(getTotalArea(getActiveRows(state))).toBe(40)
      expect(state.map((r) => r.rentPart)).toEqual([25, 25, 50])
      expect(getTotalRentPart(getActiveRows(state))).toBe(100)
    })

    it('recalculates only the companies that are neither pinned nor excluded', () => {
      const stale = [
        { _id: 'r1', name: 'A', area: 1, rentPart: 0, _pinned: true },
        { _id: 'r2', name: 'B', area: 1, rentPart: 0 },
        { _id: 'r3', name: 'C', area: 1, rentPart: 0, _excluded: true },
      ]
      const result = recalculateAreaShares(stale, sources)

      expect(result.map((r) => r.area)).toEqual([1, 10, 1])
      expect(result[0].rentPart).toBeCloseTo(9.09, 2)
      expect(result[1].rentPart).toBeCloseTo(90.91, 2)
      expect(result[2].rentPart).toBe(0)
    })
  })

  describe('redistributeShares', () => {
    it('gives 100% to the only company left in the calculation', () => {
      const result = redistributeShares([
        { name: 'A', area: 10 },
        { name: 'B', area: 10, _excluded: true },
      ])
      expect(result[0].rentPart).toBe(100)
    })

    it('returns 0 shares when everything left has no area', () => {
      const result = redistributeShares([
        { name: 'A', area: 0 },
        { name: 'B', area: 10, _excluded: true },
      ])
      expect(result[0].rentPart).toBe(0)
    })

    it('survives missing rows and out of range indexes', () => {
      expect(redistributeShares(undefined)).toEqual([])
      expect(excludeCompany(null, 0)).toEqual([])
      expect(pinCompanyArea(rows, 9).map(getCompanyState)).toEqual([
        'normal',
        'normal',
        'normal',
      ])
    })
  })
})
