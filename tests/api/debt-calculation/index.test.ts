import DebtCalculation from '@modules/models/DebtCalculation'
import byIdHandler from '@pages/api/debt-calculation/[id]'
import handler from '@pages/api/debt-calculation/index'
import { getCurrentUser } from '@utils/getCurrentUser'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@modules/models/DebtCalculation', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
  },
}))

jest.mock('@utils/getCurrentUser', () => ({
  getCurrentUser: jest.fn(),
}))

const DOMAIN = '507f1f77bcf86cd799439011'
const APT = '507f1f77bcf86cd799439012'
const CALC = '507f1f77bcf86cd799439013'

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

const mockFind = (docs: unknown[]) =>
  (DebtCalculation.find as jest.Mock).mockReturnValue({
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(docs),
    }),
  })

const validBody = {
  name: 'Крошенська 8, кв. 18',
  domain: DOMAIN,
  periodFrom: { year: 2026, month: 1 },
  periodTo: { year: 2026, month: 9 },
  annualRatePercent: 3,
  inflationMethod: 'monthly',
  overrides: {
    [APT]: { openingDebt: 8371.52, months: { '2026-04': { paid: 1000 } } },
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
  it('фільтрує за доменом і сортує від найсвіжішого', async () => {
    mockFind([{ _id: CALC }])
    const res = makeRes()

    await handler({ method: 'GET', query: { domainId: DOMAIN } } as any, res)

    expect(DebtCalculation.find).toHaveBeenCalledWith({ domain: DOMAIN })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('ігнорує некоректний domainId замість падіння', async () => {
    mockFind([])
    const res = makeRes()

    await handler({ method: 'GET', query: { domainId: 'nope' } } as any, res)

    expect(DebtCalculation.find).toHaveBeenCalledWith({})
  })

  it('відмовляє не-адміну', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: false })
    const res = makeRes()

    await handler({ method: 'GET', query: {} } as any, res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(DebtCalculation.find).not.toHaveBeenCalled()
  })
})

describe('POST /api/debt-calculation', () => {
  it('створює розрахунок і чіпляє автора', async () => {
    ;(DebtCalculation.create as jest.Mock).mockResolvedValue({ _id: CALC })
    const res = makeRes()

    await handler({ method: 'POST', query: {}, body: validBody } as any, res)

    expect(DebtCalculation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Крошенська 8, кв. 18',
        domain: DOMAIN,
        inflationMethod: 'monthly',
        createdBy: 'user-1',
      })
    )
    expect(res.status).toHaveBeenCalledWith(201)
  })

  it('вимагає назву', async () => {
    const res = makeRes()

    await handler(
      { method: 'POST', query: {}, body: { ...validBody, name: '  ' } } as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(400)
    expect(DebtCalculation.create).not.toHaveBeenCalled()
  })

  it('вимагає домен', async () => {
    const res = makeRes()

    await handler(
      {
        method: 'POST',
        query: {},
        body: { ...validBody, domain: 'nope' },
      } as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(400)
    expect(DebtCalculation.create).not.toHaveBeenCalled()
  })

  it('санітизує правки: чуже й небезпечне не доходить до бази', async () => {
    ;(DebtCalculation.create as jest.Mock).mockResolvedValue({ _id: CALC })
    const res = makeRes()

    await handler(
      {
        method: 'POST',
        query: {},
        body: {
          ...validBody,
          overrides: {
            [APT]: { openingDebt: 100, evil: { $ne: null }, note: 'текст' },
            'не-objectid': { area: 5 },
          },
        },
      } as any,
      res
    )

    const { overrides } = (DebtCalculation.create as jest.Mock).mock.calls[0][0]
    expect(overrides).toEqual({ [APT]: { openingDebt: 100 } })
  })

  it('не дає підмінити метод інфляції довільним рядком', async () => {
    ;(DebtCalculation.create as jest.Mock).mockResolvedValue({ _id: CALC })
    const res = makeRes()

    await handler(
      {
        method: 'POST',
        query: {},
        body: { ...validBody, inflationMethod: 'вигідний-мені' },
      } as any,
      res
    )

    const created = (DebtCalculation.create as jest.Mock).mock.calls[0][0]
    expect(created.inflationMethod).toBe('balance')
  })

  it('обрізає задовгу назву', async () => {
    ;(DebtCalculation.create as jest.Mock).mockResolvedValue({ _id: CALC })
    const res = makeRes()

    await handler(
      {
        method: 'POST',
        query: {},
        body: { ...validBody, name: 'я'.repeat(500) },
      } as any,
      res
    )

    const created = (DebtCalculation.create as jest.Mock).mock.calls[0][0]
    expect(created.name).toHaveLength(200)
  })
})

describe('/api/debt-calculation/[id]', () => {
  it('оновлює наявний розрахунок', async () => {
    ;(DebtCalculation.findByIdAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: CALC }),
    })
    const res = makeRes()

    await byIdHandler(
      { method: 'PATCH', query: { id: CALC }, body: validBody } as any,
      res
    )

    expect(DebtCalculation.findByIdAndUpdate).toHaveBeenCalledWith(
      CALC,
      expect.objectContaining({ name: 'Крошенська 8, кв. 18', domain: DOMAIN }),
      { new: true }
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('віддає 404, коли оновлювати нічого', async () => {
    ;(DebtCalculation.findByIdAndUpdate as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    })
    const res = makeRes()

    await byIdHandler(
      { method: 'PATCH', query: { id: CALC }, body: validBody } as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('видаляє розрахунок', async () => {
    ;(DebtCalculation.findByIdAndDelete as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: CALC }),
    })
    const res = makeRes()

    await byIdHandler({ method: 'DELETE', query: { id: CALC } } as any, res)

    expect(DebtCalculation.findByIdAndDelete).toHaveBeenCalledWith(CALC)
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('відхиляє некоректний id', async () => {
    const res = makeRes()

    await byIdHandler({ method: 'DELETE', query: { id: 'nope' } } as any, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(DebtCalculation.findByIdAndDelete).not.toHaveBeenCalled()
  })

  it('відмовляє не-адміну', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({ isAdmin: false })
    const res = makeRes()

    await byIdHandler({ method: 'DELETE', query: { id: CALC } } as any, res)

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('віддає 405 на невідомий метод', async () => {
    const res = makeRes()

    await byIdHandler({ method: 'POST', query: { id: CALC } } as any, res)

    expect(res.status).toHaveBeenCalledWith(405)
  })
})
