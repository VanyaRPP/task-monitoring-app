import InflationIndex from '@modules/models/InflationIndex'
import handler from '@pages/api/inflation-index'
import { getCurrentUser } from '@utils/getCurrentUser'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@modules/models/InflationIndex', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    bulkWrite: jest.fn(),
  },
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

const ROWS = [
  { year: 2021, month: 11, value: 100.8 },
  { year: 2021, month: 12, value: 100.6 },
  { year: 2022, month: 1, value: 101.3 },
  { year: 2022, month: 6, value: 103.1 },
]

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

const mockFind = (docs: unknown[]) =>
  (InflationIndex.find as jest.Mock).mockReturnValue({
    lean: jest.fn().mockResolvedValue(docs),
  })

const asAdmin = () =>
  (getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: true })

const asViewer = () =>
  (getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: false })

beforeEach(() => {
  jest.clearAllMocks()
  asViewer()
})

describe('GET /api/inflation-index', () => {
  it('віддає весь довідник, відсортований за періодом', async () => {
    mockFind([ROWS[2], ROWS[0], ROWS[3], ROWS[1]])
    const res = makeRes()

    await handler({ method: 'GET', query: {} } as any, res)

    expect(InflationIndex.find).toHaveBeenCalledWith({})
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0].data).toEqual(ROWS)
  })

  it('звужує запит роками і добирає межі місяців', async () => {
    mockFind(ROWS)
    const res = makeRes()

    await handler(
      { method: 'GET', query: { from: '2021-12', to: '2022-01' } } as any,
      res
    )

    expect(InflationIndex.find).toHaveBeenCalledWith({
      year: { $gte: 2021, $lte: 2022 },
    })
    // The whole of 2022 made it into the query, but June is trimmed here.
    expect(res.json.mock.calls[0][0].data).toEqual([ROWS[1], ROWS[2]])
  })

  it('ігнорує межу в неправильному форматі', async () => {
    mockFind(ROWS)
    const res = makeRes()

    await handler(
      { method: 'GET', query: { from: '2021/12', to: '2022-13' } } as any,
      res
    )

    expect(InflationIndex.find).toHaveBeenCalledWith({})
    expect(res.json.mock.calls[0][0].data).toHaveLength(4)
  })

  it('доступний не-адміну', async () => {
    mockFind([])
    const res = makeRes()

    await handler({ method: 'GET', query: {} } as any, res)

    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('POST /api/inflation-index', () => {
  it('відмовляє не-адміну', async () => {
    const res = makeRes()

    await handler(
      { method: 'POST', query: {}, body: { items: [ROWS[0]] } } as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(403)
    expect(InflationIndex.bulkWrite).not.toHaveBeenCalled()
  })

  it('апсертить список і повертає збережене', async () => {
    asAdmin()
    ;(InflationIndex.bulkWrite as jest.Mock).mockResolvedValue({})
    mockFind([ROWS[1], ROWS[0]])
    const res = makeRes()

    await handler(
      {
        method: 'POST',
        query: {},
        body: { items: [ROWS[0], ROWS[1]] },
      } as any,
      res
    )

    expect(InflationIndex.bulkWrite).toHaveBeenCalledWith([
      {
        updateOne: {
          filter: { year: 2021, month: 11 },
          update: { $set: { value: 100.8 } },
          upsert: true,
        },
      },
      {
        updateOne: {
          filter: { year: 2021, month: 12 },
          update: { $set: { value: 100.6 } },
          upsert: true,
        },
      },
    ])
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0].data).toEqual([ROWS[0], ROWS[1]])
  })

  it('приймає один об’єкт без обгортки items', async () => {
    asAdmin()
    ;(InflationIndex.bulkWrite as jest.Mock).mockResolvedValue({})
    mockFind([ROWS[0]])
    const res = makeRes()

    await handler({ method: 'POST', query: {}, body: ROWS[0] } as any, res)

    expect(InflationIndex.bulkWrite).toHaveBeenCalledTimes(1)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it.each([
    ['місяць поза 1–12', { year: 2024, month: 13, value: 100 }],
    ['рік не ціле', { year: 2024.5, month: 1, value: 100 }],
    ['індекс нуль', { year: 2024, month: 1, value: 0 }],
    ['індекс не число', { year: 2024, month: 1, value: 'сто' }],
    ['порожнє тіло', undefined],
  ])('відхиляє %s', async (_label, body) => {
    asAdmin()
    const res = makeRes()

    await handler({ method: 'POST', query: {}, body } as any, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(InflationIndex.bulkWrite).not.toHaveBeenCalled()
  })

  it('відхиляє весь список, якщо хоч один рядок битий', async () => {
    asAdmin()
    const res = makeRes()

    await handler(
      {
        method: 'POST',
        query: {},
        body: { items: [ROWS[0], { year: 2024, month: 0, value: 100 }] },
      } as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(400)
    expect(InflationIndex.bulkWrite).not.toHaveBeenCalled()
  })
})

describe('інші методи', () => {
  it('віддає 405', async () => {
    const res = makeRes()

    await handler({ method: 'DELETE', query: {} } as any, res)

    expect(res.status).toHaveBeenCalledWith(405)
  })
})
