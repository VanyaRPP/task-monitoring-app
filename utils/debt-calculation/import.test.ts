import { mergeDebtImport, PHOTO_SOURCE } from './import'
import { IDebtCalculationSnapshot } from './serialize'

const DOMAIN = '507f1f77bcf86cd799439011'
const COMPANY = '507f1f77bcf86cd799439012'
const OTHER = '507f1f77bcf86cd799439013'
const NOW = '2026-09-27T10:00:00.000Z'

const row = (
  year: number,
  month: number,
  charged = 100,
  paid = 0,
  correction = 0
) => ({
  year,
  month,
  charged,
  correction,
  paid,
})

const existing: IDebtCalculationSnapshot = {
  domain: DOMAIN,
  company: COMPANY,
  periodFrom: { year: 2024, month: 3 },
  periodTo: { year: 2024, month: 12 },
  annualRatePercent: 7,
  inflationMethod: 'monthly',
  overrides: {
    [COMPANY]: {
      openingDebt: 1000,
      legalFees: 500,
      months: {
        '2024-05': {
          paid: 50,
          tariff: 9,
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        '2024-11': { charged: 777, updatedAt: '2026-01-01T00:00:00.000Z' },
      },
    },
    [OTHER]: { openingDebt: 1 },
  },
}

describe('mergeDebtImport', () => {
  it('без збереженого розрахунку: період = місяці з фото, вхідний борг з виписки', () => {
    const merged = mergeDebtImport(
      null,
      {
        domain: DOMAIN,
        company: COMPANY,
        openingDebt: 16641.15,
        rows: [row(2019, 12), row(2019, 11, 424.46, 0, -6.86)],
      },
      NOW
    )

    expect(merged.periodFrom).toEqual({ year: 2019, month: 11 })
    expect(merged.periodTo).toEqual({ year: 2019, month: 12 })
    expect(merged.overrides[COMPANY]).toEqual({
      openingDebt: 16641.15,
      months: {
        '2019-11': {
          charged: 424.46,
          correction: -6.86,
          paid: 0,
          source: PHOTO_SOURCE,
          updatedAt: NOW,
        },
        '2019-12': {
          charged: 100,
          correction: 0,
          paid: 0,
          source: PHOTO_SOURCE,
          updatedAt: NOW,
        },
      },
    })
  })

  it('місяць з фото замінює введені суми, але не площу/тариф/індекс', () => {
    const merged = mergeDebtImport(
      existing,
      {
        domain: DOMAIN,
        company: COMPANY,
        openingDebt: 300,
        rows: [row(2024, 1), row(2024, 5, 200, 150)],
      },
      NOW
    )

    expect(merged.periodFrom).toEqual({ year: 2024, month: 1 })
    expect(merged.overrides[COMPANY].openingDebt).toBe(300)
    expect(merged.overrides[COMPANY].months['2024-05']).toEqual({
      tariff: 9,
      charged: 200,
      correction: 0,
      paid: 150,
      source: PHOTO_SOURCE,
      updatedAt: NOW,
    })
    expect(merged.overrides[COMPANY].months['2024-11']).toEqual(
      existing.overrides[COMPANY].months['2024-11']
    )
  })

  it('імпорт у середину періоду не чіпає вхідний борг, решта налаштувань ціла', () => {
    const merged = mergeDebtImport(
      existing,
      {
        domain: DOMAIN,
        company: COMPANY,
        openingDebt: 999999,
        rows: [row(2025, 2)],
      },
      NOW
    )

    expect(merged.overrides[COMPANY].openingDebt).toBe(1000)
    expect(merged.periodTo).toEqual({ year: 2025, month: 2 })
    expect(merged.annualRatePercent).toBe(7)
    expect(merged.inflationMethod).toBe('monthly')
    expect(merged.overrides[OTHER]).toEqual({ openingDebt: 1 })
    expect(merged.overrides[COMPANY].legalFees).toBe(500)
  })

  it('порожній імпорт — помилка, а не тихе обнулення', () => {
    expect(() =>
      mergeDebtImport(
        existing,
        { domain: DOMAIN, company: COMPANY, rows: [] },
        NOW
      )
    ).toThrow()
  })
})
