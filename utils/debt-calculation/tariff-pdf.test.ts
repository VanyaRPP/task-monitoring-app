import { ITextRun, readTariffTable } from './tariff-pdf'

/**
 * Text runs laid out like the management company's tariff PDF (positions as
 * `unpdf` returns them for the real documents), with made-up figures and
 * address. The traps of the real files are kept: «період» and «тарифи» in the
 * document's own title, a range broken after its hyphen, dates printed as
 * «01.10. 2019» and «10.06 2018», a tariff starting mid-month, a typo in one
 * row's apartments, and a signature under the table.
 */
const run = (str: string, x: number, y: number): ITextRun => ({
  str,
  x,
  y,
  width: str.length * 5,
})

const PERIOD_X = 113
const APARTMENTS_X = 279
const TARIFF_X = 416

interface IRowSpec {
  number: number
  y: number
  period: string
  apartments: string[]
  /** The «І поверх» tariff, then the «вище І поверху» one. */
  tariffs: [string, string]
  /** The first tariff on the row's first line rather than its group's. */
  firstOnTop?: boolean
}

const row = ({
  number,
  y,
  period,
  apartments,
  tariffs,
  firstOnTop,
}: IRowSpec): ITextRun[] => [
  run(String(number), 85, y),
  run(' ', 91, y),
  run(period, PERIOD_X, y),
  run('І поверх', PERIOD_X, y - 14),
  run('вище І поверху', PERIOD_X, y - 55),
  ...apartments.map((line, at) => run(line, APARTMENTS_X, y - 14 * at)),
  run('решта квартир', APARTMENTS_X, y - 55),
  run(tariffs[0], TARIFF_X, firstOnTop ? y : y - 14),
  run(tariffs[1], TARIFF_X, y - 55),
]

const LIST = ['№№ 1-3; 31-33; 61-', '63']

const PAGE: ITextRun[] = [
  run('Тарифи на послуги з управління багатоквартирним будинком за', 85, 772),
  run(
    'адресою вул. Тестова, 7 за період з 01.08.2018 р. по 31.10.2026 р.',
    85,
    756
  ),
  run('', 85, 712),
  run('№', 85, 712),
  run('п/п', 85, 698),
  run('Період дії тарифів', 113, 712),
  run('Номери квартир', 279, 712),
  run('в залежності від', 279, 698),
  run('Тарифи на', 416, 712),
  run('1кв.м заг. площі', 416, 670),
  ...row({
    number: 1,
    y: 642,
    period: 'З 10.06 2018 по 10.06.2019',
    apartments: LIST,
    tariffs: ['4,10', '5,20'],
  }),
  ...row({
    number: 2,
    y: 573,
    period: 'З 11.06. 2019 по 30.11.2021',
    apartments: LIST,
    tariffs: ['4,10', '6,00'],
    firstOnTop: true,
  }),
  ...row({
    number: 3,
    y: 503,
    period: 'З 01.12 2021 по 31.12.2023',
    // A typo in the document: «61-6» for «61-63».
    apartments: ['№№ 1-3; 31-33; 61-6'],
    tariffs: ['5,00', '6,50'],
  }),
  ...row({
    number: 4,
    y: 433,
    period: 'З 01.01. 2024 по даний час',
    apartments: LIST,
    tariffs: ['7,00', '9,00'],
  }),
  run('Голова правління', 113, 300),
]

describe('readTariffTable', () => {
  const { hasText, tariffs, warnings } = readTariffTable([PAGE])

  it('reads the address from the title', () => {
    expect(hasText).toBe(true)
    expect(tariffs.address).toBe('вул. Тестова, 7')
  })

  it('reads the groups: a list of apartments, and the rest', () => {
    expect(tariffs.groups).toEqual([
      { label: 'І поверх', apartments: '1-3; 31-33; 61-63' },
      { label: 'вище І поверху', apartments: '' },
    ])
  })

  it('reads every period with its dates and both tariffs', () => {
    expect(tariffs.periods).toEqual([
      { from: '2018-06-10', to: '2019-06-10', tariffs: [4.1, 5.2] },
      { from: '2019-06-11', to: '2021-11-30', tariffs: [4.1, 6] },
      { from: '2021-12-01', to: '2023-12-31', tariffs: [5, 6.5] },
      { from: '2024-01-01', tariffs: [7, 9] },
    ])
  })

  it('takes the usual apartments over a typo, and says so', () => {
    expect(warnings).toEqual([
      'Рядок 3 (з 01.12.2021): квартири «1-3; 31-33; 61-6» замість «1-3; 31-33; 61-63», як в інших рядках - узято «1-3; 31-33; 61-63».',
    ])
  })

  it('reads a table over two pages, the second without its titles', () => {
    const [first, second] = [PAGE.filter(({ y }) => y > 480), PAGE]
    const secondPage = second.filter(({ y }) => y <= 480 && y > 350)

    const read = readTariffTable([first, secondPage])

    expect(read.tariffs.periods.map(({ from }) => from)).toEqual([
      '2018-06-10',
      '2019-06-11',
      '2021-12-01',
      '2024-01-01',
    ])
  })

  it('says a scan has no text to read', () => {
    const read = readTariffTable([[run(' ', 0, 0)]])

    expect(read.hasText).toBe(false)
    expect(read.tariffs).toBeNull()
  })

  it('finds no table in another document', () => {
    const read = readTariffTable([
      [run('Інформація по місяцях', 85, 700), run('Період', 85, 680)],
    ])

    expect(read.hasText).toBe(true)
    expect(read.tariffs).toBeNull()
    expect(read.warnings[0]).toMatch(/Не знайшов таблицю тарифів/)
  })
})
