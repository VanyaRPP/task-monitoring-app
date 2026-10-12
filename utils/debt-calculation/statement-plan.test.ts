import { Operations, ServiceType } from '@utils/constants'
import { OPENING_BALANCE_FIELD } from './prefill'
import {
  IExistingPayment,
  planStatementImport,
  resolveStatementImport,
  sanitizeResolutions,
  sanitizeStatementImport,
} from './statement-plan'
import { IStatementImport } from './statement'

// Noon UTC on the 1st, as the import itself dates payments.
const at = (year: number, month: number) =>
  new Date(Date.UTC(year, month - 1, 1, 12)).toISOString()

const housing = (sum: number) => ({
  type: ServiceType.HousingFee,
  price: sum,
  sum,
})

const debit = (
  id: string,
  year: number,
  month: number,
  invoice: any[]
): IExistingPayment => ({
  _id: id,
  type: Operations.Debit,
  invoiceCreationDate: at(year, month),
  invoice,
  generalSum: invoice.reduce((acc, { sum }) => acc + sum, 0),
})

const credit = (
  id: string,
  year: number,
  month: number,
  sum: number
): IExistingPayment => ({
  _id: id,
  type: Operations.Credit,
  invoiceCreationDate: at(year, month),
  paidAt: at(year, month),
  generalSum: sum,
  invoice: [],
})

const opening = (id: string, year: number, month: number, sum: number) =>
  debit(id, year, month, [
    { type: 'custom', fieldName: OPENING_BALANCE_FIELD, price: sum, sum },
  ])

// кв. 72, 9/2019-11/2019 as the photo import produces it.
const statement: IStatementImport = {
  openingBalance: { year: 2019, month: 9, amount: 16192.23 },
  months: [
    { year: 2019, month: 9, charged: 424.46, correction: 0, paid: 0 },
    { year: 2019, month: 10, charged: 424.46, correction: 0, paid: 400 },
    { year: 2019, month: 11, charged: 424.46, correction: -6.86, paid: 0 },
  ],
}

describe('planStatementImport', () => {
  it('порожня компанія: усе нове, разом із вхідним сальдо', () => {
    const plan = planStatementImport(statement, [])

    expect(plan.months.map(({ status }) => status)).toEqual([
      'new',
      'new',
      'new',
    ])
    expect(plan.months[2].incoming).toEqual({ charged: 417.6, paid: 0 })
    expect(plan.opening).toMatchObject({ status: 'new', amount: 16192.23 })
    expect(plan.superseded).toEqual([])
  })

  it('місяць, що вже є й збігається, — пропуск; що відрізняється — конфлікт', () => {
    const plan = planStatementImport(statement, [
      // 10/2019 imported before, identically.
      debit('d10', 2019, 10, [housing(424.46)]),
      credit('c10', 2019, 10, 400),
      // 11/2019 entered by hand without the correction.
      debit('d11', 2019, 11, [housing(424.46)]),
    ])

    expect(plan.months.map(({ status }) => status)).toEqual([
      'new',
      'same',
      'conflict',
    ])
    expect(plan.months[2]).toMatchObject({
      system: { charged: 424.46, paid: 0 },
      replaceable: true,
      replaceIds: ['d11'],
    })
  })

  it('місяць з інвойсом інших послуг замінити не можна', () => {
    const plan = planStatementImport(statement, [
      debit('mixed', 2019, 9, [
        housing(400),
        { type: ServiceType.Electricity, price: 5, sum: 150 },
      ]),
    ])

    expect(plan.months[0]).toMatchObject({
      status: 'conflict',
      system: { charged: 400, paid: 0 },
      replaceable: false,
    })
  })

  it('вхідне сальдо в тому самому місяці: збіг або конфлікт', () => {
    expect(
      planStatementImport(statement, [opening('o', 2019, 9, 16192.23)]).opening
        .status
    ).toBe('same')

    expect(
      planStatementImport(statement, [opening('o', 2019, 9, 100)]).opening
    ).toMatchObject({ status: 'conflict', system: 100, replaceIds: ['o'] })
  })

  it('історія вже починається раніше — нового вхідного сальдо не буде', () => {
    const plan = planStatementImport(statement, [
      opening('o', 2019, 7, 15000),
      debit('d7', 2019, 7, [housing(424.46)]),
      debit('d8', 2019, 8, [housing(424.46)]),
      credit('c8', 2019, 8, 81.15),
    ])

    // 15000 + 424.46 + 424.46 - 81.15 = 15767.77 ≠ 16192.23
    expect(plan.opening).toMatchObject({ status: 'covered', system: 15767.77 })
    expect(plan.warnings).toHaveLength(1)
  })

  it('пізніше вхідне сальдо, яке тепер пояснюють імпортовані місяці, прибирається', () => {
    // Page 2 (from 12/2019) was imported first; now page 1 fills in before it.
    const plan = planStatementImport(statement, [
      opening('later', 2019, 12, 17058.75),
    ])

    expect(plan.superseded).toEqual([
      { id: 'later', period: '2019-12', amount: 17058.75, expected: 17058.75 },
    ])
    expect(plan.warnings).toEqual([])
    expect(resolveStatementImport(statement, plan).deleteIds).toEqual(['later'])
  })
})

describe('resolveStatementImport', () => {
  const payments = [
    debit('d10', 2019, 10, [housing(424.46)]),
    credit('c10', 2019, 10, 300),
    debit('mixed', 2019, 11, [
      housing(424.46),
      { type: ServiceType.Water, price: 1, sum: 30 },
    ]),
  ]

  it('без вибору конфлікт лишається за системою: мовчання нічого не видаляє', () => {
    const plan = planStatementImport(statement, payments)
    const resolved = resolveStatementImport(statement, plan)

    expect(resolved.months.map(({ month }) => month)).toEqual([9])
    expect(resolved.deleteIds).toEqual([])
    expect(resolved.createOpening).toBe(true)
  })

  it('«з фото» замінює записи місяця, але не там, де є інші послуги', () => {
    const plan = planStatementImport(statement, payments)
    const resolved = resolveStatementImport(statement, plan, {
      '2019-10': 'import',
      '2019-11': 'import',
    })

    expect(resolved.months.map(({ month }) => month)).toEqual([9, 10])
    expect(resolved.deleteIds).toEqual(['d10', 'c10'])
  })
})

describe('sanitizeStatementImport', () => {
  it('пропускає коректну виписку', () => {
    expect(sanitizeStatementImport(statement)).toEqual(statement)
  })

  it.each([
    ['без місяців', { months: [] }],
    [
      'з місяцем 13',
      {
        months: [{ year: 2019, month: 13, charged: 1, correction: 0, paid: 0 }],
      },
    ],
    [
      'з нечисловою оплатою',
      {
        months: [
          { year: 2019, month: 1, charged: 1, correction: 0, paid: 'x' },
        ],
      },
    ],
    [
      'з дублем місяця',
      {
        months: [
          { year: 2019, month: 1, charged: 1, correction: 0, paid: 0 },
          { year: 2019, month: 1, charged: 2, correction: 0, paid: 0 },
        ],
      },
    ],
    [
      'з кривим вхідним сальдо',
      { ...statement, openingBalance: { year: 2019, month: 9, amount: 'x' } },
    ],
  ])('відхиляє виписку %s — цілком', (_, raw) => {
    expect(sanitizeStatementImport(raw)).toBeNull()
  })
})

describe('sanitizeResolutions', () => {
  it('лишає тільки відомі ключі й значення', () => {
    expect(
      sanitizeResolutions({
        '2019-10': 'import',
        opening: 'system',
        '2019-13': 'import',
        $where: 'import',
        '2019-11': 'delete',
      })
    ).toEqual({ '2019-10': 'import', opening: 'system' })
  })
})
