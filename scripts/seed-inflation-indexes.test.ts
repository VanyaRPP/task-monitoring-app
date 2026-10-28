import InflationIndex from '../common/modules/models/InflationIndex'
import {
  INFLATION_INDEXES,
  seedInflationIndexes,
} from './seed-inflation-indexes'

jest.mock('../common/modules/models/InflationIndex', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
  },
}))

const mockExisting = (doc: unknown) =>
  (InflationIndex.findOne as jest.Mock).mockReturnValue({
    lean: jest.fn().mockResolvedValue(doc),
  })

beforeEach(() => {
  jest.clearAllMocks()
})

describe('INFLATION_INDEXES', () => {
  it('покриває січ.2015 — сер.2026 без пропусків і дублів', () => {
    expect(INFLATION_INDEXES).toHaveLength(140)
    expect(INFLATION_INDEXES[0]).toEqual([2015, 1, 103.1])
    // The end of the series only moves when Derzhstat publishes.
    expect(INFLATION_INDEXES[139]).toEqual([2026, 8, 100.1])

    const keys = INFLATION_INDEXES.map(([year, month]) => year * 12 + month)
    expect(new Set(keys).size).toBe(keys.length)
    keys.forEach((key, i) => {
      if (i > 0) expect(key).toBe(keys[i - 1] + 1)
    })
  })

  it('несе тарифний стрибок 2015-го, а не зсунутий ряд', () => {
    // April 2015 is the highest point of the whole series (+14% in a month).
    // If a source slips a row, this point slides with it.
    const byPeriod = new Map(
      INFLATION_INDEXES.map(([year, month, value]) => [
        `${year}-${month}`,
        value,
      ])
    )
    expect(byPeriod.get('2015-4')).toBe(114)
    expect(byPeriod.get('2015-3')).toBe(110.8)
    expect(byPeriod.get('2016-4')).toBe(103.5)
    // The seam with the older range: these two came from the xlsx and must match.
    expect(byPeriod.get('2021-10')).toBe(100.9)
    expect(byPeriod.get('2021-11')).toBe(100.8)
  })

  it('покриває період Акта, на якому стоїть golden-тест двигуна', () => {
    const covered = new Set(
      INFLATION_INDEXES.map(([year, month]) => `${year}-${month}`)
    )
    expect(covered.has('2021-11')).toBe(true)
    expect(covered.has('2025-6')).toBe(true)
  })

  it('містить лише правдоподібні місяці та індекси', () => {
    INFLATION_INDEXES.forEach(([year, month, value]) => {
      expect(month).toBeGreaterThanOrEqual(1)
      expect(month).toBeLessThanOrEqual(12)
      expect(year).toBeGreaterThanOrEqual(2015)
      expect(year).toBeLessThanOrEqual(2026)
      expect(value).toBeGreaterThan(90)
      expect(value).toBeLessThan(120)
    })
  })
})

describe('seedInflationIndexes', () => {
  it('створює відсутній місяць', async () => {
    mockExisting(null)
    ;(InflationIndex.create as jest.Mock).mockResolvedValue({})

    const report = await seedInflationIndexes([[2024, 5, 100.6]])

    expect(InflationIndex.create).toHaveBeenCalledWith({
      year: 2024,
      month: 5,
      value: 100.6,
    })
    expect(report.created).toEqual(['2024-05'])
    expect(report.updated).toEqual([])
    expect(report.skipped).toEqual([])
  })

  it('ідемпотентний: не чіпає вже наявний місяць', async () => {
    mockExisting({ year: 2024, month: 5, value: 100.6 })

    const report = await seedInflationIndexes([[2024, 5, 100.6]])

    expect(InflationIndex.create).not.toHaveBeenCalled()
    expect(InflationIndex.updateOne).not.toHaveBeenCalled()
    expect(report.skipped).toEqual(['2024-05'])
  })

  it('без overwrite зберігає ручну правку, навіть якщо значення інше', async () => {
    mockExisting({ year: 2024, month: 5, value: 101.1 })

    const report = await seedInflationIndexes([[2024, 5, 100.6]])

    expect(InflationIndex.updateOne).not.toHaveBeenCalled()
    expect(report.skipped).toEqual(['2024-05'])
  })

  it('з overwrite оновлює розбіжне значення', async () => {
    mockExisting({ year: 2024, month: 5, value: 101.1 })
    ;(InflationIndex.updateOne as jest.Mock).mockResolvedValue({})

    const report = await seedInflationIndexes([[2024, 5, 100.6]], {
      overwrite: true,
    })

    expect(InflationIndex.updateOne).toHaveBeenCalledWith(
      { year: 2024, month: 5 },
      { $set: { value: 100.6 } }
    )
    expect(report.updated).toEqual(['2024-05'])
  })

  it('з overwrite не чіпає значення, що вже збігається', async () => {
    mockExisting({ year: 2024, month: 5, value: 100.6 })

    const report = await seedInflationIndexes([[2024, 5, 100.6]], {
      overwrite: true,
    })

    expect(InflationIndex.updateOne).not.toHaveBeenCalled()
    expect(report.skipped).toEqual(['2024-05'])
  })
})
