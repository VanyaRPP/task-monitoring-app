import DebtCalculation from '@modules/models/DebtCalculation'
import handler from '@pages/api/debt-calculation/index'
import { getCurrentUser } from '@utils/getCurrentUser'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@modules/models/DebtCalculation', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  },
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

const DOMAIN = '507f1f77bcf86cd799439011'
const COMPANY = '507f1f77bcf86cd799439012'
const CALC = '507f1f77bcf86cd799439013'

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

/** `findOne` runs twice: first on the pair, then hunting for a legacy record. */
const mockFindOne = (...results: unknown[]) => {
  const mock = DebtCalculation.findOne as jest.Mock
  mock.mockReset()
  results.forEach((doc) =>
    mock.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(doc) })
  )
}

const body = {
  domain: DOMAIN,
  company: COMPANY,
  periodFrom: { year: 2026, month: 1 },
  periodTo: { year: 2026, month: 9 },
  annualRatePercent: 3,
  inflationMethod: 'monthly',
  overrides: {
    [COMPANY]: {
      openingDebt: 8371.52,
      months: {
        '2026-04': { paid: 1000, updatedAt: '2026-09-23T10:00:00.000Z' },
      },
    },
  },
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(getCurrentUser as jest.Mock).mockResolvedValue({
    isAdmin: true,
    user: { _id: 'user-1' },
  })
})

describe('GET /api/debt-calculation', () => {
  it('віддає розрахунок за парою домен+квартира', async () => {
    mockFindOne({ _id: CALC, company: COMPANY })
    const res = makeRes()

    await handler(
      { method: 'GET', query: { domainId: DOMAIN, companyId: COMPANY } } as any,
      res
    )

    expect(DebtCalculation.findOne).toHaveBeenCalledWith({
      domain: DOMAIN,
      company: COMPANY,
    })
    expect(res.json.mock.calls[0][0].data._id).toBe(CALC)
  })

  it('віддає null, коли нічого не збережено', async () => {
    mockFindOne(null, null)
    const res = makeRes()

    await handler(
      { method: 'GET', query: { domainId: DOMAIN, companyId: COMPANY } } as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0].data).toBeNull()
  })

  it('підхоплює запис, збережений до появи поля company', async () => {
    mockFindOne(null, {
      _id: CALC,
      domain: DOMAIN,
      overrides: { [COMPANY]: {} },
    })
    ;(DebtCalculation.updateOne as jest.Mock).mockResolvedValue({})
    const res = makeRes()

    await handler(
      { method: 'GET', query: { domainId: DOMAIN, companyId: COMPANY } } as any,
      res
    )

    expect((DebtCalculation.findOne as jest.Mock).mock.calls[1][0]).toEqual({
      domain: DOMAIN,
      company: { $exists: false },
      [`overrides.${COMPANY}`]: { $exists: true },
    })
    expect(DebtCalculation.updateOne).toHaveBeenCalledWith(
      { _id: CALC },
      { $set: { company: COMPANY } }
    )
    expect(res.json.mock.calls[0][0].data.company).toBe(COMPANY)
  })

  it.each([
    ['без квартири', { domainId: DOMAIN }],
    ['без домену', { companyId: COMPANY }],
    ['зі сміттям замість id', { domainId: 'nope', companyId: COMPANY }],
  ])('відхиляє запит %s', async (_label, query) => {
    const res = makeRes()

    await handler({ method: 'GET', query } as any, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(DebtCalculation.findOne).not.toHaveBeenCalled()
  })

  it('відмовляє не-адміну', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: false })
    const res = makeRes()

    await handler(
      { method: 'GET', query: { domainId: DOMAIN, companyId: COMPANY } } as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(403)
  })
})

describe('POST /api/debt-calculation', () => {
  const mockUpsert = (doc: unknown = { _id: CALC }) =>
    (DebtCalculation.findOneAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(doc),
    })

  it('апсертить по парі домен+квартира, без назв', async () => {
    mockUpsert()
    const res = makeRes()

    await handler({ method: 'POST', query: {}, body } as any, res)

    const [filter, update, options] = (
      DebtCalculation.findOneAndUpdate as jest.Mock
    ).mock.calls[0]
    expect(filter).toEqual({ domain: DOMAIN, company: COMPANY })
    expect(options.upsert).toBe(true)
    expect(update.$setOnInsert).toEqual({ createdBy: 'user-1' })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('зберігає мітку часу правки місяця', async () => {
    mockUpsert()
    const res = makeRes()

    await handler({ method: 'POST', query: {}, body } as any, res)

    const { $set } = (DebtCalculation.findOneAndUpdate as jest.Mock).mock
      .calls[0][1]
    expect($set.overrides[COMPANY].months['2026-04']).toEqual({
      paid: 1000,
      updatedAt: '2026-09-23T10:00:00.000Z',
    })
  })

  it('викидає нерозбірну мітку часу, лишаючи значення', async () => {
    mockUpsert()
    const res = makeRes()

    await handler(
      {
        method: 'POST',
        query: {},
        body: {
          ...body,
          overrides: {
            [COMPANY]: {
              months: { '2026-04': { paid: 5, updatedAt: 'вчора' } },
            },
          },
        },
      } as any,
      res
    )

    const { $set } = (DebtCalculation.findOneAndUpdate as jest.Mock).mock
      .calls[0][1]
    expect($set.overrides[COMPANY].months['2026-04']).toEqual({ paid: 5 })
  })

  it('санітизує правки перед записом', async () => {
    mockUpsert()
    const res = makeRes()

    await handler(
      {
        method: 'POST',
        query: {},
        body: {
          ...body,
          inflationMethod: 'вигідний-мені',
          overrides: {
            [COMPANY]: { openingDebt: 100, evil: { $ne: null } },
            'не-objectid': { area: 5 },
          },
        },
      } as any,
      res
    )

    const { $set } = (DebtCalculation.findOneAndUpdate as jest.Mock).mock
      .calls[0][1]
    expect($set.inflationMethod).toBe('balance')
    expect($set.overrides).toEqual({ [COMPANY]: { openingDebt: 100 } })
  })

  it.each([
    ['без квартири', { ...body, company: undefined }],
    ['без домену', { ...body, domain: 'nope' }],
  ])('відхиляє збереження %s', async (_label, payload) => {
    const res = makeRes()

    await handler({ method: 'POST', query: {}, body: payload } as any, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(DebtCalculation.findOneAndUpdate).not.toHaveBeenCalled()
  })

  it('відмовляє не-адміну', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: false })
    const res = makeRes()

    await handler({ method: 'POST', query: {}, body } as any, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(DebtCalculation.findOneAndUpdate).not.toHaveBeenCalled()
  })
})

describe('інші методи', () => {
  it('віддають 405', async () => {
    const res = makeRes()

    await handler({ method: 'DELETE', query: {} } as any, res)

    expect(res.status).toHaveBeenCalledWith(405)
  })
})
