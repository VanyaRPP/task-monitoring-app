import { Operations, ServiceType } from '@utils/constants'
import { buildDebtCalculationInput } from './build-input'
import { buildMonthPrefill, housingFeeCharged } from './prefill'

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
