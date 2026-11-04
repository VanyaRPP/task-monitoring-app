import { buildDebtCalculationInput } from '@utils/debt-calculation/build-input'
import { calculateDebt } from '@utils/debt-calculation/calculate'
import {
  asOfLabel,
  buildDebtCalculationDocument,
  debtCalculationFileName,
  IExcelCell,
  toXlsxStyle,
} from './debt-calculation-excel'

const FROM = { year: 2026, month: 1 }
const TO = { year: 2026, month: 3 }

const result = calculateDebt(
  buildDebtCalculationInput({
    company: { totalArea: 67.08, pricePerMeter: 5.25 },
    from: FROM,
    to: TO,
    indexByPeriod: { '2026-01': 100.7, '2026-02': 101, '2026-03': 101.7 },
    overrides: { openingDebt: 8371.52, legalFees: 3000, courtFee: 1211.2 },
  })
)

const input = (over = {}) => ({
  companyName: 'Квартира №18, вул. Крошенська 8',
  description: 'о/р 123456',
  domainName: 'ОСББ Крошенська 8',
  result,
  from: FROM,
  to: TO,
  annualRatePercent: 3,
  inflationMethod: 'balance' as const,
  area: 67.08,
  tariff: 5.25,
  openingDebt: 8371.52,
  generatedAt: new Date('2026-09-23T10:30:00'),
  ...over,
})

type Row = (IExcelCell | null)[]

const findRow = (rows: Row[], text: string): Row =>
  rows.find((line) => String(line[0]?.v ?? '').startsWith(text))

const textOf = (rows: Row[]): string =>
  rows.flatMap((line) => line.map((cell) => String(cell?.v ?? ''))).join('|')

describe('buildDebtCalculationDocument — обʼєднані клітинки', () => {
  it('нічого не лежить під чужим обʼєднанням, де Excel би це сховав', () => {
    const { rows, columns } = buildDebtCalculationDocument(input())

    rows.forEach((line, r) => {
      let coveredUntil = -1
      line.forEach((cell, c) => {
        if (!cell) return
        if (c <= coveredUntil) {
          throw new Error(
            `рядок ${r}: «${cell.v}» у колонці ${c} схований обʼєднанням`
          )
        }
        coveredUntil = c + (cell.span ?? 1) - 1
        expect(coveredUntil).toBeLessThan(columns.length)
      })
    })
  })
})

describe('buildDebtCalculationDocument — шапка', () => {
  const { rows } = buildDebtCalculationDocument(input())

  it('несе всі параметри, що видно на сторінці', () => {
    expect(findRow(rows, 'Надавач послуг')[3].v).toBe('ОСББ Крошенська 8')
    expect(findRow(rows, 'Власник')[3].v).toBe(
      'Квартира №18, вул. Крошенська 8'
    )
    expect(findRow(rows, 'Адреса')[3].v).toBe('о/р 123456')
    // Whole dates: the first day of the first month to the last of the last.
    expect(findRow(rows, 'Період')[3].v).toBe('01.01.2026 — 31.03.2026')
    expect(findRow(rows, 'Загальна площа')[3].v).toBe(67.08)
    expect(findRow(rows, 'Тариф')[3].v).toBe(5.25)
    expect(findRow(rows, 'Борг на початок')[3].v).toBe(8371.52)
    expect(findRow(rows, 'Ставка річних')[3].v).toBe(3)
    expect(findRow(rows, 'Метод інфляційних')[3].v).toMatch(/За залишком/)
  })

  it('пропускає рядок опису, коли його немає', () => {
    const bare = buildDebtCalculationDocument(input({ description: undefined }))

    expect(findRow(bare.rows, 'Адреса')).toBeUndefined()
  })

  it('називає помісячний метод, коли обрано його', () => {
    const monthly = buildDebtCalculationDocument(
      input({ inflationMethod: 'monthly' })
    )

    expect(findRow(monthly.rows, 'Метод інфляційних')[3].v).toMatch(
      /ст. 625 ЦК/
    )
  })
})

describe('buildDebtCalculationDocument — тариф, що змінювався', () => {
  const changed = calculateDebt(
    buildDebtCalculationInput({
      company: { totalArea: 67.08, pricePerMeter: 5.25 },
      from: { year: 2018, month: 8 },
      to: { year: 2024, month: 2 },
      overrides: {
        startDay: 10,
        changes: {
          tariff: [
            { from: '2019-02', value: 5.89 },
            { from: '2024-01', value: 9.91 },
          ],
        },
      },
    })
  )
  const { rows } = buildDebtCalculationDocument(
    input({ result: changed, startDay: 10 })
  )

  it('пише кожен тариф з датами, коли він діяв', () => {
    const at = rows.findIndex((line) =>
      String(line[0]?.v ?? '').startsWith('Тариф')
    )

    expect(rows.slice(at, at + 3).map((line) => line[3].v)).toEqual([
      '5.25 — з 10.08.2018 по 31.01.2019',
      '5.89 — з 01.02.2019 по 31.12.2023',
      '9.91 — з 01.01.2024 по 29.02.2024',
    ])
    expect(rows[at + 1][0].v).toBe('')
  })

  it('лишає площу одним числом, бо вона не змінювалась', () => {
    expect(findRow(rows, 'Загальна площа')[3].v).toBe(67.08)
  })
})

describe('buildDebtCalculationDocument — таблиця', () => {
  const { rows, columns } = buildDebtCalculationDocument(input())
  const header = findRow(rows, 'Місяць / Рік')

  it('має всі колонки, що рендеряться на сторінці', () => {
    expect(header.map((cell) => cell.v)).toEqual([
      'Місяць / Рік',
      'Вхідне сальдо',
      'Сплачено',
      'Нараховано',
      'Коректура',
      'Площа, м²',
      'Тариф, грн/м²',
      'Річних',
      'Вихідне сальдо',
      'Днів',
      'Індекс інфляції, %',
      'Коефіцієнт',
      'Інфляційні',
    ])
    expect(columns).toHaveLength(13)
  })

  it('шапка таблиці в рамці та із заливкою', () => {
    expect(header.every((cell) => cell.border && cell.fill === 'head')).toBe(
      true
    )
  })

  it('рядок на кожен місяць, усі клітинки в рамці', () => {
    const january = findRow(rows, 'Січень 2026')

    expect(january).toHaveLength(13)
    expect(january.every((cell) => cell.border)).toBe(true)
    expect(january[1].v).toBeCloseTo(result.rows[0].opening, 2)
    expect(january[4].v).toBeCloseTo(result.rows[0].correction, 2)
    expect(january[8].v).toBeCloseTo(result.rows[0].debt, 2)
    expect(january[9].v).toBe(31)
  })

  it('підсумковий рядок таблиці з виділенням', () => {
    const totals = findRow(rows, 'Всього')

    expect(totals[2].v).toBeCloseTo(result.totals.paid, 2)
    expect(totals[3].v).toBeCloseTo(result.totals.charged, 2)
    expect(totals[4].v).toBeCloseTo(result.totals.correction, 2)
    expect(totals[8].v).toBeCloseTo(result.body, 2)
    expect(totals[9].v).toBe(result.totals.days)
    expect(totals.every((cell) => cell.fill === 'total')).toBe(true)
  })
})

describe('buildDebtCalculationDocument — блок Акта', () => {
  const { rows } = buildDebtCalculationDocument(input())

  it('рахує дату «станом на» як перше число наступного місяця', () => {
    expect(asOfLabel({ year: 2025, month: 6 })).toBe('01.07.2025')
    expect(asOfLabel({ year: 2025, month: 12 })).toBe('01.01.2026')
    expect(asOfLabel()).toBe('—')
  })

  it('виводить загальну заборгованість', () => {
    const total = findRow(rows, 'Заборгованість станом на 01.04.2026')

    expect(total[5].v).toBeCloseTo(result.total, 2)
    expect(total[0].bold).toBe(true)
  })

  it('розбиває на складові: за послуги, річні, інфляційні та введені збори', () => {
    expect(findRow(rows, 'за послуги')[5].v).toBeCloseTo(result.body, 2)
    expect(findRow(rows, '3% річних')[5].v).toBeCloseTo(result.interest, 2)
    expect(findRow(rows, 'Інфляційні витрати')[5].v).toBeCloseTo(
      result.inflation,
      2
    )
    expect(findRow(rows, 'Юридичні послуги')[5].v).toBe(3000)
    expect(findRow(rows, 'Держмито')[5].v).toBe(1211.2)
  })

  it('називає фактичну ставку в розбивці', () => {
    const custom = buildDebtCalculationDocument(input({ annualRatePercent: 6 }))

    expect(findRow(custom.rows, '6% річних')).toBeDefined()
    expect(findRow(custom.rows, '3% річних')).toBeUndefined()
  })

  it('має місце для підпису директора', () => {
    expect(textOf(rows)).toContain('Директор')
    expect(textOf(rows)).not.toContain('Голова правління')
  })

  it('без юридичних послуг і держмита, поки їх не введено', () => {
    const plain = buildDebtCalculationDocument(
      input({
        result: calculateDebt(
          buildDebtCalculationInput({
            company: { totalArea: 67.08, pricePerMeter: 5.25 },
            from: FROM,
            to: TO,
            indexByPeriod: { '2026-01': 100.7 },
          })
        ),
      })
    )

    expect(findRow(plain.rows, 'Юридичні послуги')).toBeUndefined()
    expect(findRow(plain.rows, 'Держмито')).toBeUndefined()
  })

  it('не пояснює, що інфляційні — не сума колонки', () => {
    expect(textOf(rows)).not.toContain('не сума по колонці')
  })

  it('називає документ повною назвою', () => {
    expect(rows[0][0].v).toBe(
      'Розрахунок заборгованості за послуги з управління багатоквартирним будинком'
    )
  })

  it('починає період з числа, з якого йде борг', () => {
    const mid = buildDebtCalculationDocument(input({ startDay: 10 }))
    expect(findRow(mid.rows, 'Період')[3].v).toBe('10.01.2026 — 31.03.2026')
  })

  it('фіксує час формування', () => {
    expect(textOf(rows)).toContain('Сформовано 23.09.2026 10:30')
  })
})

describe('debtCalculationFileName', () => {
  it('склеює компанію і період без пробілів і ком', () => {
    expect(
      debtCalculationFileName('Квартира №18, вул. Крошенська 8', FROM, TO)
    ).toBe(
      'Розрахунок-заборгованості_Квартира-№18-вул.-Крошенська-8_2026-01_2026-03'
    )
  })

  it('обходиться без назви й періоду', () => {
    expect(debtCalculationFileName()).toBe('Розрахунок-заборгованості')
  })

  it('не лишає слешів, які зламали б ім’я файлу', () => {
    expect(debtCalculationFileName('ОСББ/Тест')).toBe(
      'Розрахунок-заборгованості_ОСББ-Тест'
    )
  })
})

describe('наскрізь: документ → справжній .xlsx → назад', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const XLSX = require('xlsx-js-style')

  const write = () => {
    const document = buildDebtCalculationDocument(input())
    const worksheet = XLSX.utils.aoa_to_sheet(
      document.rows.map((line) => line.map((cell) => cell?.v ?? null))
    )
    worksheet['!cols'] = document.columns

    const merges: unknown[] = []
    document.rows.forEach((line, r) =>
      line.forEach((cell, c) => {
        if (!cell) return
        const target = worksheet[XLSX.utils.encode_cell({ r, c })]
        if (!target) return
        // The very same conversion the real export uses.
        target.s = toXlsxStyle(cell)
        if (cell.span > 1) {
          merges.push({ s: { r, c }, e: { r, c: c + cell.span - 1 } })
        }
      })
    )
    worksheet['!merges'] = merges

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, document.sheetName)

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  }

  it('файл відкривається, аркуш названий, кирилиця ціла', () => {
    const reopened = XLSX.read(write(), { type: 'buffer' })

    expect(reopened.SheetNames).toEqual(['Розрахунок'])
    const text = XLSX.utils.sheet_to_csv(reopened.Sheets['Розрахунок'])
    expect(text).toContain('Квартира №18, вул. Крошенська 8')
    expect(text).toContain('Заборгованість станом на 01.04.2026 року')
    expect(text).toContain('Директор')
  })

  it('рамки й заливка справді потрапляють у файл', () => {
    // The `xlsx-js-style` reader only restores the fill from a cell, so we
    // assert against `xl/styles.xml` inside the workbook rather than against
    // what was read back.
    const book = XLSX.read(write(), { type: 'buffer', bookFiles: true })
    const styles = book.files['xl/styles.xml']
    const xml = styles.asNodeBuffer
      ? styles.asNodeBuffer().toString()
      : String(styles.content ?? '')

    expect(xml).toContain('thin')
    expect(xml).toContain('DDE5F0')
    expect(xml).toContain('F0F0F0')
  })

  it('об’єднані клітинки на місці', () => {
    const sheet = XLSX.read(write(), { type: 'buffer' }).Sheets['Розрахунок']

    expect(sheet['!merges'].length).toBeGreaterThan(5)
  })

  it('числа лишились числами', () => {
    const sheet = XLSX.read(write(), { type: 'buffer' }).Sheets['Розрахунок']
    const numeric = Object.keys(sheet)
      .filter((key) => !key.startsWith('!'))
      .filter((key) => sheet[key]?.t === 'n')

    expect(numeric.length).toBeGreaterThan(20)
  })
})

describe('buildDebtCalculationDocument — виключені періоди', () => {
  const excludedPeriods = [
    {
      id: 'p1',
      type: 'cmu_206' as const,
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    },
    {
      id: 'p2',
      type: 'custom' as const,
      startDate: '2026-03-10',
      endDate: '2026-03-31',
    },
  ]
  const excluded = calculateDebt(
    buildDebtCalculationInput({
      company: { totalArea: 67.08, pricePerMeter: 5.25 },
      from: FROM,
      to: TO,
      indexByPeriod: { '2026-01': 100.7, '2026-02': 101, '2026-03': 101.7 },
      overrides: { openingDebt: 8371.52 },
      inflationMethod: 'monthly',
      excludedPeriods,
    })
  )
  const { rows } = buildDebtCalculationDocument(
    input({ result: excluded, excludedPeriods, inflationMethod: 'monthly' })
  )

  it('пише кожен період тегом і примітку під ними', () => {
    expect(findRow(rows, 'Виключені періоди')[3].v).toBe(
      'КМУ №206: 01.01.2026—31.01.2026'
    )
    expect(textOf(rows)).toContain('Довільний: 10.03.2026—31.03.2026')
    expect(textOf(rows)).toContain(
      'Інфляційні втрати та річні за зазначені періоди не нараховувалися.'
    )
  })

  it('підсумки документа — ті самі, що в розрахунку на сторінці', () => {
    const totals = findRow(rows, 'Всього')
    expect(totals[7].v).toBeCloseTo(excluded.interest, 2)
    expect(totals[9].v).toBe(excluded.totals.days)
    expect(textOf(rows)).toContain(String(+excluded.inflation.toFixed(2)))
    // January wholly out, 9 of 31 March days left: 0 + 28 + 9.
    expect(excluded.totals.days).toBe(37)
  })

  it('без виключень — жодного рядка про них', () => {
    const plain = buildDebtCalculationDocument(input())
    expect(findRow(plain.rows, 'Виключені періоди')).toBeUndefined()
    expect(textOf(plain.rows)).not.toContain('не нараховувалися')
  })
})
