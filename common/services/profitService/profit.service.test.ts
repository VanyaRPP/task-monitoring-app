import ProfitService, { CreateProfitInput } from './profit.service'
import ProfitModel from '@modules/models/Profit'

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

const find = ProfitModel.find as jest.Mock
const countDocuments = ProfitModel.countDocuments as jest.Mock
const aggregate = ProfitModel.aggregate as jest.Mock
const create = ProfitModel.create as jest.Mock
const insertMany = ProfitModel.insertMany as jest.Mock

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
