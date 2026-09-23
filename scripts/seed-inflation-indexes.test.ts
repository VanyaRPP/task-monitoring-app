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
  it('покриває лис.2021 — сер.2026 без пропусків і дублів', () => {
    expect(INFLATION_INDEXES).toHaveLength(58)
    expect(INFLATION_INDEXES[0]).toEqual([2021, 11, 100.8])
    // Кінець ряду рухається лише разом із публікаціями Держстату.
    expect(INFLATION_INDEXES[57]).toEqual([2026, 8, 100.1])

    const keys = INFLATION_INDEXES.map(([year, month]) => year * 12 + month)
    expect(new Set(keys).size).toBe(keys.length)
    keys.forEach((key, i) => {
      if (i > 0) expect(key).toBe(keys[i - 1] + 1)
    })
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
      expect(year).toBeGreaterThanOrEqual(2021)
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
