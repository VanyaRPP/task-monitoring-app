import { buildDebtCalculationInput } from '@utils/debt-calculation/build-input'
import { calculateDebt } from '@utils/debt-calculation/calculate'
import {
  buildDebtCalculationSheets,
  debtCalculationFileName,
} from './debt-calculation-excel'

const FROM = { year: 2026, month: 1 }
const TO = { year: 2026, month: 3 }

const makeResult = (openingDebt = 100) =>
  calculateDebt(
    buildDebtCalculationInput({
      company: { totalArea: 67.08, pricePerMeter: 5.25 },
      from: FROM,
      to: TO,
      indexByPeriod: { '2026-01': 100.7, '2026-02': 101, '2026-03': 101.7 },
      overrides: { openingDebt, legalFees: 3000, courtFee: 1211.2 },
    })
  )

const input = (over = {}) => ({
  apartments: [
    { name: 'Квартира №3', description: 'о/р 123', result: makeResult() },
  ],
  from: FROM,
  to: TO,
  annualRatePercent: 3,
  inflationMethod: 'balance' as const,
  domainName: 'ОСББ Крошенська 8',
  generatedAt: new Date('2026-09-22T10:30:00Z'),
  ...over,
})

describe('buildDebtCalculationSheets — підсумок', () => {
  it('дає рядок на квартиру плюс РАЗОМ', () => {
    const { summary } = buildDebtCalculationSheets(input())

    expect(summary).toHaveLength(2)
    expect(summary[0].Квартира).toBe('Квартира №3')
    expect(summary[1].Квартира).toBe('РАЗОМ')
  })

  it('числа лишаються числами, щоб Excel їх сумував', () => {
    const { summary } = buildDebtCalculationSheets(input())

    expect(typeof summary[0]['Тіло боргу']).toBe('number')
    expect(typeof summary[0].Разом).toBe('number')
  })

  it('колонка річних несе фактичну ставку', () => {
    const { summary } = buildDebtCalculationSheets(
      input({ annualRatePercent: 6 })
    )

    expect(Object.keys(summary[0])).toContain('6% річних')
    expect(Object.keys(summary[0])).not.toContain('3% річних')
  })

  it('РАЗОМ підсумовує колонки по квартирах', () => {
    const apartments = [
      { name: 'кв. 1', result: makeResult(100) },
      { name: 'кв. 2', result: makeResult(200) },
    ]
    const { summary } = buildDebtCalculationSheets(input({ apartments }))
    const [a, b, total] = summary

    expect(total['Тіло боргу']).toBeCloseTo(
      (a['Тіло боргу'] as number) + (b['Тіло боргу'] as number),
      2
    )
    expect(total.Разом).toBeCloseTo(
      (a.Разом as number) + (b.Разом as number),
      2
    )
  })

  it('борг на початок відновлюється з підсумків', () => {
    const { summary } = buildDebtCalculationSheets(input())

    expect(summary[0]['Борг на початок']).toBeCloseTo(100, 2)
  })

  it('порожній список не дає рядка РАЗОМ', () => {
    const { summary } = buildDebtCalculationSheets(input({ apartments: [] }))

    expect(summary).toEqual([])
  })
})

describe('buildDebtCalculationSheets — помісячно', () => {
  it('складає місяці всіх квартир в один аркуш із колонкою «Квартира»', () => {
    const apartments = [
      { name: 'кв. 1', result: makeResult() },
      { name: 'кв. 2', result: makeResult() },
    ]
    const { months } = buildDebtCalculationSheets(input({ apartments }))

    expect(months).toHaveLength(6)
    expect(months[0].Квартира).toBe('кв. 1')
    expect(months[3].Квартира).toBe('кв. 2')
  })

  it('місяць підписано словами', () => {
    const { months } = buildDebtCalculationSheets(input())

    expect(months[0].Місяць).toBe('Січень 2026')
    expect(months[2].Місяць).toBe('Березень 2026')
  })

  it('коефіцієнт накопичується від індексів наступних місяців', () => {
    const { months } = buildDebtCalculationSheets(input())

    // Січень — місяць виникнення боргу, його індекс не застосовується.
    expect(months[1].Коефіцієнт).toBeCloseTo(1.01, 6)
    expect(months[2].Коефіцієнт).toBeCloseTo(1.02717, 6)
  })

  it('перший місяць має коефіцієнт 1 і нульові інфляційні', () => {
    const { months } = buildDebtCalculationSheets(input())

    expect(months[0].Коефіцієнт).toBe(1)
    expect(months[0].Інфляційні).toBe(0)
  })
})

describe('buildDebtCalculationSheets — параметри', () => {
  it('фіксує період, ставку й метод', () => {
    const { params } = buildDebtCalculationSheets(input())
    const byKey = Object.fromEntries(
      params.map(({ Параметр, Значення }) => [Параметр, Значення])
    )

    expect(byKey['Період з']).toBe('2026-01')
    expect(byKey['Період по']).toBe('2026-03')
    expect(byKey['Ставка річних, %']).toBe(3)
    expect(byKey['Метод інфляційних']).toMatch(/За залишком/)
    expect(byKey['Квартир у розрахунку']).toBe(1)
  })

  it('називає помісячний метод, коли обрано його', () => {
    const { params } = buildDebtCalculationSheets(
      input({ inflationMethod: 'monthly' })
    )

    expect(
      params.find(({ Параметр }) => Параметр === 'Метод інфляційних').Значення
    ).toMatch(/ст. 625 ЦК/)
  })

  it('попереджає, що інфляційні — не сума колонки', () => {
    const { params } = buildDebtCalculationSheets(input())

    expect(
      params.find(({ Параметр }) => Параметр === 'Увага').Значення
    ).toMatch(/не сума по колонці/)
  })
})

describe('debtCalculationFileName', () => {
  it('склеює домен і період без пробілів', () => {
    expect(debtCalculationFileName('ОСББ Крошенська 8', FROM, TO)).toBe(
      'Розрахунок-заборгованості_ОСББ-Крошенська-8_2026-01_2026-03'
    )
  })

  it('обходиться без домену й періоду', () => {
    expect(debtCalculationFileName()).toBe('Розрахунок-заборгованості')
  })

  it('не лишає слешів, які зламали б ім’я файлу', () => {
    expect(debtCalculationFileName('ОСББ/Тест')).toBe(
      'Розрахунок-заборгованості_ОСББ-Тест'
    )
  })
})

describe('наскрізь: аркуші → справжній .xlsx → назад', () => {
  it('файл читається і зберігає числа числами', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const XLSX = require('xlsx-js-style')
    const sheets = buildDebtCalculationSheets(input())

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(sheets.summary),
      'Підсумок'
    )
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(sheets.months),
      'Помісячно'
    )
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(sheets.params),
      'Параметри'
    )

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    const reopened = XLSX.read(buffer, { type: 'buffer' })

    expect(reopened.SheetNames).toEqual(['Підсумок', 'Помісячно', 'Параметри'])

    const summary = XLSX.utils.sheet_to_json(reopened.Sheets['Підсумок'])
    expect(summary).toHaveLength(2)
    expect(summary[0].Квартира).toBe('Квартира №3')
    expect(typeof summary[0]['Тіло боргу']).toBe('number')
    expect(summary[0]['Тіло боргу']).toBeCloseTo(
      sheets.summary[0]['Тіло боргу'] as number,
      2
    )

    const months = XLSX.utils.sheet_to_json(reopened.Sheets['Помісячно'])
    expect(months).toHaveLength(3)
    expect(months[0].Місяць).toBe('Січень 2026')
    expect(typeof months[0]['Сума боргу']).toBe('number')
  })

  it('кирилиця в назвах аркушів і колонок не б’ється', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const XLSX = require('xlsx-js-style')
    const { params } = buildDebtCalculationSheets(input())

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(params),
      'Параметри'
    )
    const reopened = XLSX.read(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
      { type: 'buffer' }
    )
    const rows = XLSX.utils.sheet_to_json(reopened.Sheets['Параметри'])

    expect(rows[0].Параметр).toBe('Домен')
    expect(rows[0].Значення).toBe('ОСББ Крошенська 8')
  })
})
