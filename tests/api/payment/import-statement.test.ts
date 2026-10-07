import handler from '@pages/api/spacehub/payment/import-statement'
import { getCurrentUser } from '@utils/getCurrentUser'
import {
  applyCompanyStatementImport,
  loadImportTarget,
  planCompanyStatementImport,
  StatementImportError,
} from '@common/services/paymentService/statementImport.service'

jest.mock('@pages/api/api.config', () => ({
  __esModule: true,
  default: jest.fn(),
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
  return {
    StatementImportError,
    loadImportTarget: jest.fn(),
    planCompanyStatementImport: jest.fn(),
    applyCompanyStatementImport: jest.fn(),
  }
})

const DOMAIN = '507f1f77bcf86cd799439011'
const COMPANY = '507f1f77bcf86cd799439012'

const statement = {
  openingBalance: { year: 2019, month: 9, amount: 16192.23 },
  months: [{ year: 2019, month: 9, charged: 424.46, correction: 0, paid: 0 }],
}

const makeRes = () => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

const post = (body: unknown) => ({ method: 'POST', body }) as any

const user = { _id: 'u1', email: 'admin@x.ua' }

beforeEach(() => {
  jest.clearAllMocks()
  ;(getCurrentUser as jest.Mock).mockResolvedValue({
    isDomainAdmin: true,
    isGlobalAdmin: false,
    user,
  })
  ;(loadImportTarget as jest.Mock).mockResolvedValue({
    company: {},
    housing: {},
  })
})

describe('POST /api/spacehub/payment/import-statement', () => {
  it('без apply лише планує — нічого не пише', async () => {
    ;(planCompanyStatementImport as jest.Mock).mockResolvedValue({ months: [] })
    const res = makeRes()

    await handler(
      post({ domainId: DOMAIN, companyId: COMPANY, statement }),
      res
    )

    expect(loadImportTarget).toHaveBeenCalledWith(DOMAIN, COMPANY, {
      isGlobalAdmin: false,
      user,
    })
    expect(applyCompanyStatementImport).not.toHaveBeenCalled()
    expect(res.json.mock.calls[0][0].data).toEqual({ plan: { months: [] } })
  })

  it('apply: true — пише з очищеними виборами користувача', async () => {
    ;(applyCompanyStatementImport as jest.Mock).mockResolvedValue({
      plan: {},
      result: { createdIds: ['p1'] },
    })
    const res = makeRes()

    await handler(
      post({
        domainId: DOMAIN,
        companyId: COMPANY,
        statement,
        apply: true,
        resolutions: { '2019-09': 'import', $where: 'import' },
        source: 'вул. Покровська буд. 149 кв. 72',
      }),
      res
    )

    expect(applyCompanyStatementImport).toHaveBeenCalledWith(
      expect.objectContaining({
        resolutions: { '2019-09': 'import' },
        source: 'вул. Покровська буд. 149 кв. 72',
        statement,
      })
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('помилки доступу з сервісу — зі своїм статусом', async () => {
    ;(loadImportTarget as jest.Mock).mockRejectedValue(
      new StatementImportError(403, 'Немає доступу')
    )
    const res = makeRes()

    await handler(
      post({ domainId: DOMAIN, companyId: COMPANY, statement }),
      res
    )

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it.each([
    ['без виписки', { domainId: DOMAIN, companyId: COMPANY }],
    ['з кривим id', { domainId: 'x', companyId: COMPANY, statement }],
    [
      'з кривою випискою',
      { domainId: DOMAIN, companyId: COMPANY, statement: { months: [{}] } },
    ],
  ])('відхиляє запит %s', async (_, body) => {
    const res = makeRes()

    await handler(post(body), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(loadImportTarget).not.toHaveBeenCalled()
  })

  it('звичайному користувачу — 403', async () => {
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      isDomainAdmin: false,
      isGlobalAdmin: false,
      user,
    })
    const res = makeRes()

    await handler(
      post({ domainId: DOMAIN, companyId: COMPANY, statement }),
      res
    )

    expect(res.status).toHaveBeenCalledWith(403)
    expect(loadImportTarget).not.toHaveBeenCalled()
  })
})
