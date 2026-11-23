import {
  addressKey,
  describeBatch,
  groupStatements,
  IReadPhoto,
} from './grouping'

const header = (address: string | null, apartment: string | null = null) => ({
  address,
  apartment,
  ownerName: null,
  accountNumber: null,
})

const row = (
  year: number,
  month: number,
  opening: number,
  charged: number,
  paid: number
) => ({
  year,
  month,
  opening,
  correction: 0,
  charged,
  paid,
  closing: Math.round((opening + charged - paid) * 100) / 100,
})

const photo = (
  jobId: string,
  address: string | null,
  rows: ReturnType<typeof row>[],
  extra: Partial<IReadPhoto> = {}
): IReadPhoto => ({
  jobId,
  name: `${jobId}.jpg`,
  header: header(address),
  candidates: [],
  suggestedCompanyId: null,
  strips: [rows],
  issues: [],
  ...extra,
})

const page1 = [row(2022, 4, 1000, 100, 0), row(2022, 5, 1100, 100, 50)]
const page2 = [row(2022, 6, 1150, 100, 0), row(2022, 7, 1250, 100, 0)]

describe('addressKey', () => {
  it('береться з чисел адреси — однаковий для обрізаної шапки', () => {
    expect(addressKey(header('вул. Покровська буд. 149 кв. 72'))).toBe('149/72')
    expect(addressKey(header('са: вул. Покровська буд. 149 кв. 72'))).toBe(
      '149/72'
    )
    expect(addressKey(header('вул. Покровська буд. 149', '72'))).toBe('149/72')
    expect(addressKey(header(null))).toBeNull()
  })
})

describe('groupStatements', () => {
  it('дві сторінки однієї квартири — одна виписка, інша квартира — окремо', () => {
    const groups = groupStatements([
      photo('p1', 'вул. Покровська буд. 149 кв. 72', page1),
      photo('p3', 'вул. Покровська буд. 149 кв. 71', [
        row(2018, 8, 622.86, 285.27, 0),
      ]),
      photo('p2', 'вул. Покровська буд. 149 кв. 72', page2),
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0].photoNames).toEqual(['p1.jpg', 'p2.jpg'])
    expect(groups[0].rows.map(({ month }) => month)).toEqual([4, 5, 6, 7])
    expect(groups[0].issues).toEqual([])
  })

  it('чужу квартиру з тією самою адресою в шапці (помилка читання) не зливає', () => {
    // кв. 71 read as «кв. 72»: same months, different balances.
    const groups = groupStatements([
      photo('p1', 'вул. Покровська буд. 149 кв. 72', page1),
      photo('p3', 'вул. Покровська буд. 149 кв. 72', [
        row(2022, 4, 14052.06, 373.71, 0),
        row(2022, 5, 14425.77, 373.71, 0),
      ]),
    ])

    expect(groups).toHaveLength(2)
  })

  it('те саме фото двічі — одна виписка', () => {
    const groups = groupStatements([
      photo('p1', 'кв. 72', page1),
      photo('p1-again', 'кв. 72', page1),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].rows).toHaveLength(2)
  })

  it('сторінку без шапки приєднує, якщо вона продовжує сальдо', () => {
    const groups = groupStatements([
      photo('p1', null, page1),
      photo('p2', null, page2),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].rows).toHaveLength(4)
  })

  it('підказку компанії бере з фото, де вона однозначна', () => {
    const candidate = {
      id: 'c72',
      companyName: 'Квартира №72',
      domainId: 'd',
      domainName: 'ОСББ',
    }
    const [group] = groupStatements([
      photo('p1', 'кв. 72', page1),
      photo('p2', 'кв. 72', page2, {
        candidates: [candidate],
        suggestedCompanyId: 'c72',
      }),
    ])

    expect(group.suggestedCompanyId).toBe('c72')
    expect(group.candidates).toEqual([candidate])
  })
})

describe('describeBatch', () => {
  it('коротко переказує прочитане для чат-моделі', () => {
    const groups = groupStatements([
      photo('p1', 'вул. Покровська буд. 149 кв. 72', [...page1, ...page2]),
    ])

    const text = describeBatch(groups, 1)

    expect(text).toContain(
      'вул. Покровська буд. 149 кв. 72: 4 міс. (04.2022–07.2022)'
    )
    expect(text).toContain('вихідне сальдо 1350 грн')
    expect(text).toContain('не розпізнано фото: 1')
  })
})
