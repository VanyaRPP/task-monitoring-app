import ProfitService, { CreateProfitInput } from './profit.service'
import ProfitModel from '@modules/models/Profit'
import Payment from '@common/modules/models/Payment'

jest.mock('@modules/models/Profit', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    create: jest.fn(),
    insertMany: jest.fn(),
  },
}))

jest.mock('@common/modules/models/Payment', () => ({
  __esModule: true,
  default: { aggregate: jest.fn() },
}))

const find = ProfitModel.find as jest.Mock
const countDocuments = ProfitModel.countDocuments as jest.Mock
const aggregate = ProfitModel.aggregate as jest.Mock
const create = ProfitModel.create as jest.Mock
const insertMany = ProfitModel.insertMany as jest.Mock
const paymentAggregate = Payment.aggregate as unknown as jest.Mock

const validInput: CreateProfitInput = {
  domain: 'd1',
  amount: 1,
  type: 'credit',
  date: new Date('2024-01-15'),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ProfitService.getBalance', () => {
  it('adds credits and subtracts debits', async () => {
    find.mockResolvedValue([
      { type: 'credit', amount: 100 },
      { type: 'debit', amount: 30 },
      { type: 'credit', amount: 5 },
    ])

    await expect(ProfitService.getBalance('d1')).resolves.toBe(75)
    expect(find).toHaveBeenCalledWith({ domain: 'd1' })
  })

  it('returns 0 for a domain with no records', async () => {
    find.mockResolvedValue([])
    await expect(ProfitService.getBalance('d1')).resolves.toBe(0)
  })

  it('can go negative when debits exceed credits', async () => {
    find.mockResolvedValue([{ type: 'debit', amount: 40 }])
    await expect(ProfitService.getBalance('d1')).resolves.toBe(-40)
  })
})

describe('ProfitService.bulkCreate', () => {
  it('throws when there is nothing to insert', async () => {
    await expect(ProfitService.bulkCreate([])).rejects.toThrow(
      'No records to insert'
    )
    expect(insertMany).not.toHaveBeenCalled()
  })

  it('delegates to insertMany for a non-empty list', async () => {
    const docs = [{ _id: '1' }]
    insertMany.mockResolvedValue(docs)

    await expect(ProfitService.bulkCreate([validInput])).resolves.toBe(docs)
    expect(insertMany).toHaveBeenCalledWith([validInput])
  })
})

describe('ProfitService.create', () => {
  it('returns the created record on success', async () => {
    const doc = { _id: '1' }
    create.mockResolvedValue(doc)

    await expect(ProfitService.create(validInput)).resolves.toBe(doc)
  })

  it('wraps storage errors in a friendly message', async () => {
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    create.mockRejectedValue(new Error('db down'))

    await expect(ProfitService.create(validInput)).rejects.toThrow(
      'Unable to create profit. Please try again later.'
    )
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})

describe('ProfitService.getAll', () => {
  it('returns paginated records with computed meta', async () => {
    const records = [{ _id: '1' }, { _id: '2' }]
    const chain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(records),
    }
    find.mockReturnValue(chain)
    countDocuments.mockResolvedValue(25)

    const result = await ProfitService.getAll(2, 10)

    expect(chain.skip).toHaveBeenCalledWith(10) // (page - 1) * limit
    expect(chain.limit).toHaveBeenCalledWith(10)
    expect(result.data).toBe(records)
    expect(result.meta).toEqual({
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3, // ceil(25 / 10)
    })
  })
})

describe('ProfitService.getAllWithMonthSeparation', () => {
  it('groups records under a "Month Year" key', async () => {
    aggregate.mockResolvedValue([
      { _id: { year: 2024, month: 1 }, profits: [{ _id: 'a' }] },
    ])
    countDocuments.mockResolvedValue(1)

    const result = await ProfitService.getAllWithMonthSeparation(1, 10)

    expect(result.data).toEqual({ 'January 2024': [{ _id: 'a' }] })
    expect(result.meta.totalPages).toBe(1)
  })
})

describe('ProfitService.getByDomainWithMonthSeparation', () => {
  const domainId = '64d68421d9ba2fc8fea79d51'

  // Shape returned by the two $group stages the service runs.
  const income = (
    year: number,
    month: number,
    expected: number,
    actual: number,
    currency = 'UAH'
  ) => ({
    _id: { year, month, currency },
    expected,
    actual,
    invoiceCount: 1,
    paymentCount: 1,
  })

  // Expenses group on a `YYYY-MM` string, because the key can come straight
  // from `periodMonth` without going through a date.
  const expense = (
    monthKey: string,
    expenses: number,
    manualIncome = 0,
    transactions: any[] = [],
    currency = 'UAH'
  ) => ({
    _id: { monthKey, currency },
    expenses,
    manualIncome,
    transactions,
  })

  it('keeps invoiced, received and spent as three separate numbers', async () => {
    paymentAggregate.mockResolvedValue([income(2026, 6, 150000, 120000)])
    aggregate.mockResolvedValue([expense('2026-06', 85000)])

    const result = await ProfitService.getByDomainWithMonthSeparation(domainId)

    expect(result.data['2026-06']).toMatchObject({
      month: '2026-06',
    })
    expect(result.data['2026-06'].byCurrency.UAH).toMatchObject({
      expected: 150000,
      actual: 120000,
      expenses: 85000,
      net: 35000,
    })
  })

  it('zero-pads the month key so it sorts lexicographically', async () => {
    paymentAggregate.mockResolvedValue([
      income(2026, 1, 10, 10),
      income(2026, 11, 20, 20),
    ])
    aggregate.mockResolvedValue([])

    const result = await ProfitService.getByDomainWithMonthSeparation(domainId)

    expect(Object.keys(result.data)).toEqual(['2026-11', '2026-01'])
  })

  it('surfaces a month that only has expenses, and one that only has income', async () => {
    paymentAggregate.mockResolvedValue([income(2026, 6, 150000, 120000)])
    aggregate.mockResolvedValue([expense('2026-05', 4000)])

    const result = await ProfitService.getByDomainWithMonthSeparation(domainId)

    expect(Object.keys(result.data)).toEqual(['2026-06', '2026-05'])
    expect(result.data['2026-06'].byCurrency.UAH).toMatchObject({
      expenses: 0,
      net: 120000,
    })
    expect(result.data['2026-05'].byCurrency.UAH).toMatchObject({
      expected: 0,
      actual: 0,
      expenses: 4000,
      net: -4000,
    })
  })

  it('counts hand-entered income towards the actual figure', async () => {
    paymentAggregate.mockResolvedValue([income(2026, 6, 0, 1000)])
    aggregate.mockResolvedValue([expense('2026-06', 200, 500)])

    const result = await ProfitService.getByDomainWithMonthSeparation(domainId)

    expect(result.data['2026-06'].byCurrency.UAH).toMatchObject({
      actual: 1500,
      expenses: 200,
      net: 1300,
    })
  })

  it('pages over months and keeps each month total complete', async () => {
    // Regression guard: pagination used to slice records before grouping, so
    // a month total was only the part that happened to land on the page.
    paymentAggregate.mockResolvedValue([
      income(2026, 6, 600, 600),
      income(2026, 5, 500, 500),
      income(2026, 4, 400, 400),
    ])
    aggregate.mockResolvedValue([])

    const page1 = await ProfitService.getByDomainWithMonthSeparation(
      domainId,
      1,
      1
    )
    expect(Object.keys(page1.data)).toEqual(['2026-06'])
    expect(page1.data['2026-06'].byCurrency.UAH.expected).toBe(600)
    expect(page1.meta).toMatchObject({ total: 3, totalPages: 3, limit: 1 })

    const page2 = await ProfitService.getByDomainWithMonthSeparation(
      domainId,
      2,
      1
    )
    expect(Object.keys(page2.data)).toEqual(['2026-05'])
    expect(page2.data['2026-05'].byCurrency.UAH.expected).toBe(500)
  })

  it('derives outstanding as invoiced minus collected', async () => {
    paymentAggregate.mockResolvedValue([
      income(2026, 6, 150000, 120000),
      // Overpaid: outstanding goes negative rather than clamping, so the
      // number stays honest and the UI can decide how to show it.
      income(2026, 5, 1000, 1200),
    ])
    aggregate.mockResolvedValue([])

    const result = await ProfitService.getByDomainWithMonthSeparation(domainId)

    expect(result.data['2026-06'].byCurrency.UAH.outstanding).toBe(30000)
    expect(result.data['2026-05'].byCurrency.UAH.outstanding).toBe(-200)
  })

  it('keeps currencies apart instead of adding them together', async () => {
    paymentAggregate.mockResolvedValue([
      income(2026, 6, 150000, 120000, 'UAH'),
      income(2026, 6, 4000, 1500, 'USD'),
    ])
    aggregate.mockResolvedValue([expense('2026-06', 85000, 0, [], 'UAH')])

    const result = await ProfitService.getByDomainWithMonthSeparation(domainId)
    const row = result.data['2026-06']

    expect(row.byCurrency.UAH).toMatchObject({
      expected: 150000,
      actual: 120000,
      expenses: 85000,
      outstanding: 30000,
      net: 35000,
    })
    // No UAH expenses were booked against the USD side, so net equals actual.
    expect(row.byCurrency.USD).toMatchObject({
      expected: 4000,
      actual: 1500,
      expenses: 0,
      outstanding: 2500,
      net: 1500,
    })
    // Busiest currency first.
    expect(row.currencies).toEqual(['UAH', 'USD'])
  })

  it('files a payment under the month it is FOR, not when it was paid', async () => {
    // Mocks cannot execute the pipeline, so assert its shape. Grouping on the
    // month service is the whole point of this change: an invoice for June
    // paid on 1 July must land in June, not July.
    paymentAggregate.mockResolvedValue([])
    aggregate.mockResolvedValue([])

    await ProfitService.getByDomainWithMonthSeparation(domainId)

    const pipeline = paymentAggregate.mock.calls[0][0]

    // monthService holds a STRING id in a Mixed field, so it has to be
    // converted before it can match services._id.
    const addFields = pipeline.find((st: any) => st.$addFields)?.$addFields
    expect(addFields.monthServiceId.$convert).toMatchObject({
      input: '$monthService',
      to: 'objectId',
      onError: null,
      onNull: null,
    })

    expect(pipeline.find((st: any) => st.$lookup)?.$lookup).toMatchObject({
      from: 'services',
      localField: 'monthServiceId',
      foreignField: '_id',
    })

    // Legacy rows without a month service must still land somewhere.
    const project = pipeline.find((st: any) => st.$project)?.$project
    expect(project.effectiveDate).toEqual({
      $ifNull: [
        { $arrayElemAt: ['$service.date', 0] },
        {
          $cond: [
            { $eq: ['$type', 'credit'] },
            { $ifNull: ['$paidAt', '$invoiceCreationDate'] },
            '$invoiceCreationDate',
          ],
        },
      ],
    })
  })

  it('files an expense under periodMonth, falling back to the paid date', async () => {
    paymentAggregate.mockResolvedValue([])
    aggregate.mockResolvedValue([])

    await ProfitService.getByDomainWithMonthSeparation(domainId)

    const pipeline = aggregate.mock.calls[0][0]
    const addFields = pipeline.find((st: any) => st.$addFields)?.$addFields
    expect(addFields.monthKey).toEqual({
      $ifNull: [
        '$periodMonth',
        { $dateToString: { format: '%Y-%m', date: '$date' } },
      ],
    })
    expect(pipeline.find((st: any) => st.$group)?.$group._id).toEqual({
      monthKey: '$monthKey',
      currency: { $ifNull: ['$currency', 'UAH'] },
    })
  })

  it('meta.total counts months, not individual records', async () => {
    paymentAggregate.mockResolvedValue([
      income(2026, 6, 1, 1),
      income(2026, 5, 1, 1),
    ])
    aggregate.mockResolvedValue([
      expense('2026-06', 1, 0, [{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }]),
    ])

    const result = await ProfitService.getByDomainWithMonthSeparation(domainId)

    expect(result.meta.total).toBe(2)
    expect(result.data['2026-06'].transactions).toHaveLength(3)
  })
})
