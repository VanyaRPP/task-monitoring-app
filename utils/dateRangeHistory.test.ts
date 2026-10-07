import {
  DATE_RANGE_HISTORY_LIMIT,
  DATE_RANGE_HISTORY_STORAGE_KEY,
  DateRangeHistoryStore,
  addDateRangeToHistory,
  emptyDateRangeHistory,
  formatDateRangeHistoryLabel,
  getDateRangeHistory,
  getDateRangeHistoryScope,
  parseDateRangeHistory,
  readDateRangeHistory,
  writeDateRangeHistory,
} from '@utils/dateRangeHistory'

const AUG_SEP = { dateFrom: '2026-08-01', dateTo: '2026-09-28' }
const YEAR_2025 = { dateFrom: '2025-01-01', dateTo: '2025-12-31' }
const MARCH_2026 = { dateFrom: '2026-03-01', dateTo: '2026-03-31' }

const ranges = (store: DateRangeHistoryStore, scope: string) =>
  getDateRangeHistory(store, scope).map(({ from, to }) => `${from}..${to}`)

describe('getDateRangeHistoryScope()', () => {
  it('global, коли не обрано ні компанію, ні домен', () => {
    expect(getDateRangeHistoryScope(undefined)).toBe('global')
    expect(getDateRangeHistoryScope({ company: [], domain: [] })).toBe('global')
  })

  it('domain:<id> для одного домену', () => {
    expect(getDateRangeHistoryScope({ domain: ['A'] })).toBe('domain:A')
  })

  it('company:<id> для однієї компанії', () => {
    expect(getDateRangeHistoryScope({ company: ['X'] })).toBe('company:X')
  })

  it('компанія має пріоритет над доменом', () => {
    expect(getDateRangeHistoryScope({ domain: ['A'], company: ['X'] })).toBe(
      'company:X'
    )
  })

  it('комбінація — окремий scope, порядок вибору не важливий', () => {
    expect(getDateRangeHistoryScope({ domain: ['B', 'A'] })).toBe('domain:A,B')
    expect(getDateRangeHistoryScope({ domain: ['A', 'B'] })).toBe('domain:A,B')
    expect(getDateRangeHistoryScope({ company: ['Y', 'X'] })).toBe(
      'company:X,Y'
    )
  })

  it('не мутує масиви фільтрів під час сортування', () => {
    const company = ['Y', 'X']
    getDateRangeHistoryScope({ company })
    expect(company).toEqual(['Y', 'X'])
  })
})

describe('addDateRangeToHistory()', () => {
  it('додає новий проміжок на початок', () => {
    let store = emptyDateRangeHistory()
    store = addDateRangeToHistory(store, 'global', YEAR_2025, 1)
    store = addDateRangeToHistory(store, 'global', AUG_SEP, 2)

    expect(getDateRangeHistory(store, 'global')).toEqual([
      { from: '2026-08-01', to: '2026-09-28', usedAt: 2 },
      { from: '2025-01-01', to: '2025-12-31', usedAt: 1 },
    ])
  })

  it('не створює дублікат, а переносить повторний проміжок на початок', () => {
    let store = emptyDateRangeHistory()
    store = addDateRangeToHistory(store, 'global', AUG_SEP, 1)
    store = addDateRangeToHistory(store, 'global', YEAR_2025, 2)
    store = addDateRangeToHistory(store, 'global', MARCH_2026, 3)
    store = addDateRangeToHistory(store, 'global', AUG_SEP, 4)

    expect(ranges(store, 'global')).toEqual([
      '2026-08-01..2026-09-28',
      '2026-03-01..2026-03-31',
      '2025-01-01..2025-12-31',
    ])
    expect(getDateRangeHistory(store, 'global')[0].usedAt).toBe(4)
  })

  it(`зберігає не більше ${DATE_RANGE_HISTORY_LIMIT} записів, відкидаючи найстаріші`, () => {
    let store = emptyDateRangeHistory()
    for (let day = 1; day <= DATE_RANGE_HISTORY_LIMIT + 3; day++) {
      const date = `2026-01-${String(day).padStart(2, '0')}`
      store = addDateRangeToHistory(
        store,
        'global',
        { dateFrom: date, dateTo: date },
        day
      )
    }

    const items = getDateRangeHistory(store, 'global')
    expect(items).toHaveLength(DATE_RANGE_HISTORY_LIMIT)
    expect(items[0].from).toBe(`2026-01-0${DATE_RANGE_HISTORY_LIMIT + 3}`)
    expect(items.map((i) => i.from)).not.toContain('2026-01-01')
  })

  it('веде окрему історію для різних доменів', () => {
    let store = emptyDateRangeHistory()
    store = addDateRangeToHistory(store, 'domain:A', YEAR_2025)
    store = addDateRangeToHistory(store, 'domain:B', MARCH_2026)
    store = addDateRangeToHistory(store, 'domain:B', AUG_SEP)

    expect(ranges(store, 'domain:A')).toEqual(['2025-01-01..2025-12-31'])
    expect(ranges(store, 'domain:B')).toEqual([
      '2026-08-01..2026-09-28',
      '2026-03-01..2026-03-31',
    ])
    expect(ranges(store, 'global')).toEqual([])
  })

  it('веде окрему історію для різних компаній', () => {
    let store = emptyDateRangeHistory()
    store = addDateRangeToHistory(store, 'company:X', YEAR_2025)
    store = addDateRangeToHistory(store, 'company:Y', AUG_SEP)

    expect(ranges(store, 'company:X')).toEqual(['2025-01-01..2025-12-31'])
    expect(ranges(store, 'company:Y')).toEqual(['2026-08-01..2026-09-28'])
  })

  it('комбінація не об’єднує історію окремих доменів', () => {
    let store = emptyDateRangeHistory()
    store = addDateRangeToHistory(store, 'domain:A', YEAR_2025)
    store = addDateRangeToHistory(store, 'domain:B', MARCH_2026)
    const combo = getDateRangeHistoryScope({ domain: ['B', 'A'] })
    store = addDateRangeToHistory(store, combo, AUG_SEP)

    expect(ranges(store, combo)).toEqual(['2026-08-01..2026-09-28'])
    expect(ranges(store, 'domain:A')).toEqual(['2025-01-01..2025-12-31'])
  })

  it('ігнорує некоректний проміжок', () => {
    const store = emptyDateRangeHistory()
    expect(
      addDateRangeToHistory(store, 'global', {
        dateFrom: 'bad',
        dateTo: '2026-01-01',
      })
    ).toBe(store)
  })
})

describe('localStorage', () => {
  beforeEach(() => window.localStorage.clear())

  it('відновлює історію після reload', () => {
    const store = addDateRangeToHistory(
      addDateRangeToHistory(emptyDateRangeHistory(), 'global', AUG_SEP, 1),
      'company:X',
      YEAR_2025,
      2
    )
    writeDateRangeHistory(store)

    expect(readDateRangeHistory()).toEqual(store)
    expect(
      JSON.parse(window.localStorage.getItem(DATE_RANGE_HISTORY_STORAGE_KEY))
    ).toEqual({
      version: 1,
      scopes: {
        global: [{ from: '2026-08-01', to: '2026-09-28', usedAt: 1 }],
        'company:X': [{ from: '2025-01-01', to: '2025-12-31', usedAt: 2 }],
      },
    })
  })

  it.each([
    ['порожньо', null],
    ['не JSON', '{oops'],
    ['інша версія', JSON.stringify({ version: 2, scopes: {} })],
  ])('повертає порожню історію: %s', (_, raw) => {
    expect(parseDateRangeHistory(raw)).toEqual(emptyDateRangeHistory())
  })

  it('відкидає биті записи, зберігаючи коректні', () => {
    const raw = JSON.stringify({
      version: 1,
      scopes: {
        global: [
          { from: '2026-08-01', to: '2026-09-28', usedAt: 1 },
          { from: 'x', to: '2026-09-28', usedAt: 2 },
          { from: '2026-08-01', to: '2026-09-28' },
        ],
        'domain:A': 'not-an-array',
      },
    })

    expect(parseDateRangeHistory(raw)).toEqual({
      version: 1,
      scopes: {
        global: [{ from: '2026-08-01', to: '2026-09-28', usedAt: 1 }],
      },
    })
  })
})

describe('formatDateRangeHistoryLabel()', () => {
  it.each([
    [{ from: '2025-01-01', to: '2025-12-31' }, '2025 рік'],
    [{ from: '2026-08-01', to: '2026-08-31' }, 'Серпень 2026'],
    [{ from: '2028-02-01', to: '2028-02-29' }, 'Лютий 2028'],
    [{ from: '2026-08-01', to: '2026-09-28' }, '01.08.2026 — 28.09.2026'],
    [{ from: '2026-08-01', to: '2026-09-30' }, '01.08.2026 — 30.09.2026'],
  ])('%o → %s', (item, label) => {
    expect(formatDateRangeHistoryLabel(item)).toBe(label)
  })
})
