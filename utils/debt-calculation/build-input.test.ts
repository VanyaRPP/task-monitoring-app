import { calculateDebt } from './calculate'
import { buildDebtCalculationInput, indexesByPeriod } from './build-input'

const FROM = { year: 2024, month: 1 }
const TO = { year: 2024, month: 3 }

describe('indexesByPeriod', () => {
  it('згортає довідник у мапу за YYYY-MM', () => {
    expect(
      indexesByPeriod([
        { year: 2021, month: 11, value: 100.8 },
        { year: 2022, month: 1, value: 101.3 },
      ])
    ).toEqual({ '2021-11': 100.8, '2022-01': 101.3 })
  })

  it('порожній вхід дає порожню мапу', () => {
    expect(indexesByPeriod()).toEqual({})
    expect(indexesByPeriod([])).toEqual({})
  })
})

describe('buildDebtCalculationInput', () => {
  it('розгортає період у місяці й бере площу з тариф із компанії', () => {
    const input = buildDebtCalculationInput({
      company: { totalArea: 67.08, pricePerMeter: 5.25 },
      from: FROM,
      to: TO,
    })

    expect(input.months).toHaveLength(3)
    expect(input.months[0]).toEqual({
      year: 2024,
      month: 1,
      area: 67.08,
      tariff: 5.25,
      charged: undefined,
      paid: 0,
      inflationIndex: undefined,
    })
  })

  it('підставляє індекс із довідника за періодом', () => {
    const input = buildDebtCalculationInput({
      from: FROM,
      to: TO,
      indexByPeriod: { '2024-01': 100.4, '2024-03': 100.5 },
    })

    expect(input.months.map((m) => m.inflationIndex)).toEqual([
      100.4,
      undefined,
      100.5,
    ])
  })

  it('правка квартири перекриває дані компанії', () => {
    const input = buildDebtCalculationInput({
      company: { totalArea: 67.08, pricePerMeter: 5.25 },
      from: FROM,
      to: TO,
      overrides: { area: 50, tariff: 7 },
    })

    expect(input.months.every((m) => m.area === 50 && m.tariff === 7)).toBe(
      true
    )
  })

  it('правка місяця перекриває правку квартири', () => {
    const input = buildDebtCalculationInput({
      company: { totalArea: 67.08, pricePerMeter: 5.25 },
      from: FROM,
      to: TO,
      overrides: {
        tariff: 7,
        months: { '2024-02': { tariff: 9, paid: 500, inflationIndex: 103 } },
      },
    })

    expect(input.months.map((m) => m.tariff)).toEqual([7, 9, 7])
    expect(input.months.map((m) => m.paid)).toEqual([0, 500, 0])
    expect(input.months[1].inflationIndex).toBe(103)
  })

  it('не вигадує charged — двигун рахує площа × тариф сам', () => {
    const input = buildDebtCalculationInput({
      company: { totalArea: 10, pricePerMeter: 10 },
      from: FROM,
      to: FROM,
    })

    expect(input.months[0].charged).toBeUndefined()
    expect(calculateDebt(input).rows[0].charged).toBe(100)
  })

  it('явний charged у правці місяця доходить до двигуна', () => {
    const input = buildDebtCalculationInput({
      company: { totalArea: 10, pricePerMeter: 10 },
      from: FROM,
      to: FROM,
      overrides: { months: { '2024-01': { charged: 333 } } },
    })

    expect(calculateDebt(input).rows[0].charged).toBe(333)
  })

  it('переносить борг на початок, юр. послуги та держмито', () => {
    const input = buildDebtCalculationInput({
      from: FROM,
      to: TO,
      overrides: { openingDebt: 352.17, legalFees: 3000, courtFee: 1211.2 },
    })

    expect(input.openingDebt).toBe(352.17)
    expect(input.legalFees).toBe(3000)
    expect(input.courtFee).toBe(1211.2)
  })

  it('дефолтить ставку 3% і метод balance', () => {
    const input = buildDebtCalculationInput({ from: FROM, to: TO })

    expect(input.annualRatePercent).toBe(3)
    expect(input.inflationMethod).toBe('balance')
  })

  it('порожній період дає порожній список місяців', () => {
    expect(buildDebtCalculationInput({}).months).toEqual([])
    expect(buildDebtCalculationInput({ from: TO, to: FROM }).months).toEqual([])
  })

  it('нулі компанії не ламають розрахунок', () => {
    const result = calculateDebt(
      buildDebtCalculationInput({
        company: { totalArea: null, pricePerMeter: undefined },
        from: FROM,
        to: TO,
      })
    )

    expect(result.body).toBe(0)
    expect(result.total).toBe(0)
  })
})

describe('buildDebtCalculationInput + calculateDebt — наскрізь на даних Акта', () => {
  it('відтворює підсумок Акта через шар UI', () => {
    // The same Act, assembled the way the page assembles it: the company
    // supplies area and tariff, the reference table supplies indices, and the
    // month edits supply payments plus the July 2024 tariff change.
    const indexes = [
      [2021, 11, 100.8],
      [2021, 12, 100.6],
      [2022, 1, 101.3],
      [2022, 2, 101.6],
      [2022, 3, 104.5],
      [2022, 4, 103.1],
      [2022, 5, 102.7],
      [2022, 6, 103.1],
      [2022, 7, 100.7],
      [2022, 8, 101.1],
      [2022, 9, 101.9],
      [2022, 10, 102.5],
      [2022, 11, 100.7],
      [2022, 12, 100.7],
      [2023, 1, 100.8],
      [2023, 2, 100.7],
      [2023, 3, 101.5],
      [2023, 4, 100.2],
      [2023, 5, 100.5],
      [2023, 6, 100.8],
      [2023, 7, 99.4],
      [2023, 8, 98.6],
      [2023, 9, 100.5],
      [2023, 10, 100.8],
      [2023, 11, 100.5],
      [2023, 12, 100.7],
      [2024, 1, 100.4],
      [2024, 2, 100.3],
      [2024, 3, 100.5],
      [2024, 4, 100.2],
      [2024, 5, 100.6],
      [2024, 6, 102.2],
      [2024, 7, 100],
      [2024, 8, 100.6],
      [2024, 9, 101.5],
      [2024, 10, 101.8],
      [2024, 11, 101.9],
      [2024, 12, 101.4],
      [2025, 1, 101.2],
      [2025, 2, 100.8],
      [2025, 3, 101.5],
      [2025, 4, 100.7],
      [2025, 5, 101.3],
      [2025, 6, 100.8],
    ].map(([year, month, value]) => ({ year, month, value }))

    const payments: Record<string, number> = {
      '2022-10': 500,
      '2023-01': 352.17,
      '2023-05': 2000,
      '2023-06': 1000,
      '2023-07': 1000,
      '2024-02': 500,
      '2024-07': 500,
      '2024-09': 500,
      '2024-12': 1000,
      '2025-01': 1000,
      '2025-04': 420,
      '2025-06': 500,
    }

    const months: Record<string, { paid?: number; tariff?: number }> = {}
    indexes.forEach(({ year, month }) => {
      const key = `${year}-${String(month).padStart(2, '0')}`
      const raisedTariff = year * 12 + month >= 2024 * 12 + 7
      months[key] = {
        ...(payments[key] ? { paid: payments[key] } : {}),
        ...(raisedTariff ? { tariff: 6.25 } : {}),
      }
    })

    const result = calculateDebt(
      buildDebtCalculationInput({
        company: { totalArea: 67.08, pricePerMeter: 5.25 },
        from: { year: 2021, month: 11 },
        to: { year: 2025, month: 6 },
        indexByPeriod: indexesByPeriod(indexes),
        overrides: { openingDebt: 352.17, months },
      })
    )

    expect(result.rows).toHaveLength(44)
    expect(result.body).toBeCloseTo(7380.44, 6)
    expect(result.interest).toBeCloseTo(516.9665973905232, 6)
    expect(result.inflation).toBeCloseTo(4395.853893921326, 6)
  })
})
