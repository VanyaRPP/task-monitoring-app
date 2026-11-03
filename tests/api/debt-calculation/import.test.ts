import DebtCalculation from '@modules/models/DebtCalculation'
import handler from '@pages/api/debt-calculation/import'
import { getCurrentUser } from '@utils/getCurrentUser'
import {
  loadImportTarget,
  StatementImportError,
} from '@common/services/paymentService/statementImport.service'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('@modules/models/DebtCalculation', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), findOneAndUpdate: jest.fn() },
}))
jest.mock('@utils/getCurrentUser', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@common/services/paymentService/statementImport.service', () => {
  class StatementImportError extends Error {
    constructor(
      readonly status: number,
      message: string
    ) {
      super(message)
    }
  }
  return { StatementImportError, loadImportTarget: jest.fn() }
})

const DOMAIN = '507f1f77bcf86cd799439011'
const COMPANY = '507f1f77bcf86cd799439012'
const user = { _id: 'user-1', email: 'admin@example.com' }

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}
const lean = (value: unknown) => ({ lean: jest.fn().mockResolvedValue(value) })

const body = {
  domainId: DOMAIN,
  companyId: COMPANY,
  openingDebt: 16641.15,
  rows: [
    { year: 2019, month: 11, charged: 424.46, correction: -6.86, paid: 0 },
    { year: 2019, month: 12, charged: 424.46, correction: 0, paid: 400 },
  ],
}
const post = (payload: unknown = body) =>
  ({ method: 'POST', body: payload }) as any

beforeEach(() => {
  jest.clearAllMocks()
  ;(getCurrentUser as jest.Mock).mockResolvedValue({
    isAdmin: true,
    isGlobalAdmin: false,
    user,
  })
  ;(loadImportTarget as jest.Mock).mockResolvedValue({})
  ;(DebtCalculation.findOne as jest.Mock).mockReturnValue(lean(null))
  ;(DebtCalculation.findOneAndUpdate as jest.Mock).mockImplementation(
    (_filter, update) => lean({ _id: 'calc', ...update.$set })
  )
})

describe('POST /api/debt-calculation/import', () => {
  it('зливає місяці з фото в розрахунок — з коректурою й позначкою джерела', async () => {
    const res = makeRes()

    await handler(post(), res)

    expect(loadImportTarget).toHaveBeenCalledWith(DOMAIN, COMPANY, {
      isGlobalAdmin: false,
      user,
    })
    expect(res.status).toHaveBeenCalledWith(200)
    const [filter, update] = (DebtCalculation.findOneAndUpdate as jest.Mock)
      .mock.calls[0]
    expect(filter).toEqual({ domain: DOMAIN, company: COMPANY })
    expect(update.$set.overrides[COMPANY]).toMatchObject({
      openingDebt: 16641.15,
      months: {
        '2019-11': {
          charged: 424.46,
          correction: -6.86,
          paid: 0,
          source: 'photo',
        },
        '2019-12': {
          charged: 424.46,
          correction: 0,
          paid: 400,
          source: 'photo',
        },
      },
    })
  })

  it('немає прав на домен — статус від перевірки, нічого не пише', async () => {
    ;(loadImportTarget as jest.Mock).mockRejectedValue(
      new StatementImportError(403, 'Немає доступу')
    )
    const res = makeRes()

    await handler(post(), res)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(DebtCalculation.findOneAndUpdate).not.toHaveBeenCalled()
  })

  it.each([
    ['без рядків', { ...body, rows: [] }],
    [
      'з місяцем 13',
      { ...body, rows: [{ year: 2019, month: 13, charged: 1, paid: 0 }] },
    ],
    [
      'з нечисловою оплатою',
      { ...body, rows: [{ year: 2019, month: 1, charged: 1, paid: 'x' }] },
    ],
    ['зі сміттям замість id', { ...body, companyId: 'nope' }],
  ])('відхиляє запит %s', async (_label, payload) => {
    const res = makeRes()

    await handler(post(payload), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(DebtCalculation.findOneAndUpdate).not.toHaveBeenCalled()
  })

  it('не-адміну — 403, не POST — 405', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({ isAdmin: false })
    const forbidden = makeRes()
    await handler(post(), forbidden)
    expect(forbidden.status).toHaveBeenCalledWith(403)

    const wrong = makeRes()
    await handler({ method: 'GET' } as any, wrong)
    expect(wrong.status).toHaveBeenCalledWith(405)
  })
})
