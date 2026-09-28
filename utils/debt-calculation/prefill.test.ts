import { Operations, ServiceType } from '@utils/constants'
import { buildDebtCalculationInput } from './build-input'
import {
  buildMonthPrefill,
  CORRECTION_FIELD,
  housingFeeCharged,
  OPENING_BALANCE_FIELD,
  prefillOpeningDebt,
} from './prefill'

const housingLine = (sum: number) => ({
  type: ServiceType.HousingFee,
  price: sum,
  sum,
})

const debit = (over = {}) => ({
  type: Operations.Debit,
  company: { _id: 'apt-1' },
  monthService: { date: new Date(2024, 0, 1) },
  invoice: [housingLine(352.17)],
  generalSum: 352.17,
  ...over,
})

const credit = (over = {}) => ({
  type: Operations.Credit,
  company: { _id: 'apt-1' },
  paidAt: new Date(2024, 0, 20),
  generalSum: 500,
  ...over,
})

describe('housingFeeCharged', () => {
  it('сумує рядки квартплати', () => {
    expect(
      housingFeeCharged({ invoice: [housingLine(100), housingLine(50)] })
    ).toBe(150)
  })

  it('впізнає рядок за fieldName, коли type не проставлено', () => {
    expect(
      housingFeeCharged({
        invoice: [
          { type: 'custom', fieldName: 'housingFeePrice', price: 0, sum: 42 },
        ],
      })
    ).toBe(42)
  })

  it('не падає на generalSum, коли рядка квартплати немає', () => {
    expect(
      housingFeeCharged({
        invoice: [{ type: ServiceType.Electricity, price: 0, sum: 900 }],
        generalSum: 900,
      })
    ).toBeUndefined()
  })

  it('undefined на порожньому рахунку', () => {
    expect(housingFeeCharged({})).toBeUndefined()
    expect(housingFeeCharged()).toBeUndefined()
  })
})

describe('buildMonthPrefill', () => {
  it('бере тариф із місячної послуги домену', () => {
    const prefill = buildMonthPrefill({
      services: [
        { date: new Date(2024, 0, 1), rentPrice: 5.25 },
        { date: new Date(2024, 6, 1), rentPrice: 6.25 },
      ],
    })

    expect(prefill['2024-01'].tariff).toBe(5.25)
    expect(prefill['2024-07'].tariff).toBe(6.25)
  })

  it('ігнорує послугу без дати або з нульовим тарифом', () => {
    const prefill = buildMonthPrefill({
      services: [
        { rentPrice: 5 },
        { date: new Date(2024, 0, 1), rentPrice: 0 },
        { date: 'не дата', rentPrice: 7 },
      ],
    })

    expect(prefill).toEqual({})
  })

  it('бере нараховано з рахунку за місяцем його послуги', () => {
    const prefill = buildMonthPrefill({
      companyId: 'apt-1',
      payments: [debit()],
    })

    expect(prefill['2024-01'].charged).toBe(352.17)
  })

  it('падає на invoiceCreationDate, коли послуга не популейтнута', () => {
    const prefill = buildMonthPrefill({
      companyId: 'apt-1',
      payments: [
        debit({
          monthService: 'only-an-id',
          invoiceCreationDate: new Date(2024, 2, 5),
        }),
      ],
    })

    expect(prefill['2024-03'].charged).toBe(352.17)
  })

  it('бере сплачено з credit за датою оплати', () => {
    const prefill = buildMonthPrefill({
      companyId: 'apt-1',
      payments: [credit()],
    })

    expect(prefill['2024-01'].paid).toBe(500)
  })

  it('падає на invoiceCreationDate, коли paidAt немає — старі записи', () => {
    const prefill = buildMonthPrefill({
      companyId: 'apt-1',
      payments: [
        credit({
          paidAt: undefined,
          invoiceCreationDate: new Date(2024, 4, 9),
        }),
      ],
    })

    expect(prefill['2024-05'].paid).toBe(500)
  })

  it('додає кілька оплат одного місяця', () => {
    const prefill = buildMonthPrefill({
      companyId: 'apt-1',
      payments: [credit(), credit({ generalSum: 300 })],
    })

    expect(prefill['2024-01'].paid).toBe(800)
  })

  it('відсікає платежі інших квартир', () => {
    const prefill = buildMonthPrefill({
      companyId: 'apt-1',
      payments: [credit({ company: { _id: 'apt-2' } }), debit()],
    })

    expect(prefill['2024-01'].paid).toBeUndefined()
    expect(prefill['2024-01'].charged).toBe(352.17)
  })

  it('впізнає компанію, задану рядком-id', () => {
    const prefill = buildMonthPrefill({
      companyId: 'apt-1',
      payments: [credit({ company: 'apt-1' })],
    })

    expect(prefill['2024-01'].paid).toBe(500)
  })

  it('ігнорує платіж невідомого типу', () => {
    const prefill = buildMonthPrefill({
      companyId: 'apt-1',
      payments: [credit({ type: 'whatever' })],
    })

    expect(prefill).toEqual({})
  })

  it('поєднує тариф, нараховано і сплачено в одному місяці', () => {
    const prefill = buildMonthPrefill({
      companyId: 'apt-1',
      payments: [debit(), credit()],
      services: [{ date: new Date(2024, 0, 1), rentPrice: 5.25 }],
    })

    expect(prefill['2024-01']).toEqual({
      tariff: 5.25,
      charged: 352.17,
      paid: 500,
    })
  })
})

describe('префіл у buildDebtCalculationInput', () => {
  const from = { year: 2024, month: 1 }
  const to = { year: 2024, month: 1 }
  const prefillMonths = {
    '2024-01': { tariff: 6.25, charged: 419.25, paid: 500 },
  }

  it('перекриває дані компанії', () => {
    const [month] = buildDebtCalculationInput({
      company: { totalArea: 67.08, pricePerMeter: 5.25 },
      from,
      to,
      prefillMonths,
    }).months

    expect(month.tariff).toBe(6.25)
    expect(month.charged).toBe(419.25)
    expect(month.paid).toBe(500)
  })

  it('поступається ручній правці місяця', () => {
    const [month] = buildDebtCalculationInput({
      company: { totalArea: 67.08, pricePerMeter: 5.25 },
      from,
      to,
      prefillMonths,
      overrides: { months: { '2024-01': { paid: 0, charged: 100 } } },
    }).months

    expect(month.paid).toBe(0)
    expect(month.charged).toBe(100)
  })

  it('поступається ручній правці квартири', () => {
    const [month] = buildDebtCalculationInput({
      company: { totalArea: 67.08, pricePerMeter: 5.25 },
      from,
      to,
      prefillMonths,
      overrides: { tariff: 9 },
    }).months

    expect(month.tariff).toBe(9)
  })
})

describe('«Вхідне сальдо» з імпорту', () => {
  const openingInvoice = (sum: number, date: Date) =>
    debit({
      monthService: undefined,
      invoiceCreationDate: date,
      invoice: [
        { type: 'custom', fieldName: OPENING_BALANCE_FIELD, price: sum, sum },
      ],
      generalSum: sum,
    })

  // History: 11 262,17 brought in at 8/2018, then two months of charges and a payment.
  const payments = [
    openingInvoice(11262.17, new Date(2018, 7, 1, 12)),
    debit({
      monthService: undefined,
      invoiceCreationDate: new Date(2018, 7, 1, 12),
      invoice: [housingLine(393.14)],
    }),
    debit({
      monthService: undefined,
      invoiceCreationDate: new Date(2018, 8, 1, 12),
      invoice: [housingLine(393.14)],
    }),
    credit({ paidAt: new Date(2018, 8, 1, 12), generalSum: 400 }),
  ]

  const prefill = buildMonthPrefill({ companyId: 'apt-1', payments })

  it('не рахується нарахуванням свого місяця', () => {
    expect(prefill['2018-08']).toEqual({
      charged: 393.14,
      openingBalance: 11262.17,
    })
  })

  it('на початок історії борг — саме вхідне сальдо', () => {
    expect(prefillOpeningDebt(prefill, { year: 2018, month: 8 })).toBe(11262.17)
  })

  it('пізніший період відкривається з боргом, накопиченим з історії', () => {
    // 11262,17 + 393,14 + 393,14 - 400 = 11648,45
    expect(prefillOpeningDebt(prefill, { year: 2018, month: 10 })).toBe(
      11648.45
    )
  })

  it('без вхідного сальдо до початку періоду — нічого не вигадує', () => {
    expect(
      prefillOpeningDebt(prefill, { year: 2018, month: 7 })
    ).toBeUndefined()
    expect(
      prefillOpeningDebt(buildMonthPrefill({ payments: [debit()] }), {
        year: 2024,
        month: 1,
      })
    ).toBeUndefined()
  })

  it('борг на початок: ручний → з історії → 0', () => {
    const from = { year: 2018, month: 9 }
    const base = { from, to: from, prefillMonths: prefill }

    expect(
      buildDebtCalculationInput({ ...base, prefillOpeningDebt: 11655.31 })
        .openingDebt
    ).toBe(11655.31)
    expect(
      buildDebtCalculationInput({
        ...base,
        prefillOpeningDebt: 11655.31,
        overrides: { openingDebt: 1 },
      }).openingDebt
    ).toBe(1)
    expect(buildDebtCalculationInput(base).openingDebt).toBe(0)
  })

  it('вхідне сальдо всередині періоду зʼявляється боргом свого місяця', () => {
    const input = buildDebtCalculationInput({
      from: { year: 2018, month: 7 },
      to: { year: 2018, month: 8 },
      prefillMonths: prefill,
    })

    expect(input.months.map(({ charged }) => charged)).toEqual([
      undefined,
      11655.31,
    ])
  })
})

describe('коректура з платежів', () => {
  it('рядок «Коректура» йде в свою колонку, нарахування лишається повним', () => {
    const prefill = buildMonthPrefill({
      companyId: 'apt-1',
      payments: [
        debit({
          invoice: [
            housingLine(424.46),
            {
              type: ServiceType.HousingFee,
              fieldName: CORRECTION_FIELD,
              price: -6.86,
              sum: -6.86,
            },
          ],
        }),
      ],
    })

    expect(prefill['2024-01']).toEqual({ charged: 424.46, correction: -6.86 })
  })

  it('ручна коректура перемагає префіл', () => {
    const from = { year: 2024, month: 1 }
    const input = buildDebtCalculationInput({
      from,
      to: from,
      prefillMonths: { '2024-01': { charged: 424.46, correction: -6.86 } },
      overrides: { months: { '2024-01': { correction: -10 } } },
    })

    expect(input.months[0]).toMatchObject({ charged: 424.46, correction: -10 })
  })
})
