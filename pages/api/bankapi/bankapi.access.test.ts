import crypto from 'crypto'
import Domain from '@modules/models/Domain'
import { encryptBankToken } from '@common/services/bankTokenService/bankTokenCrypto'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users } from '@utils/testData'
import { getFinalBalances } from './balances/utils/getBalances/index'
import { getBankDates } from './date/utils/getBankDates/index'
import {
  getFinalTransactions,
  getTransactionsForDateInterval,
} from './transactions/utils/getTransactions/index'
import balancesHandler from './balances'
import dateHandler from './date'
import transactionsHandler from './transactions'
import finalTransactionsHandler from './transactions/final'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())
jest.mock('./balances/utils/getBalances/index', () => ({
  getFinalBalances: jest.fn(),
}))
jest.mock('./date/utils/getBankDates/index', () => ({
  getBankDates: jest.fn(),
}))
jest.mock('./transactions/utils/getTransactions/index', () => ({
  getFinalTransactions: jest.fn(),
  getTransactionsForDateInterval: jest.fn(),
}))

setupTestEnvironment()

const OWN = String(domains[0]._id) // administered by users.domainAdmin
const FOREIGN = String(domains[1]._id)
const OWN_TOKEN = 'own-privatbank-token'
const FOREIGN_TOKEN = 'foreign-privatbank-token'

const originalEnv = process.env
beforeEach(async () => {
  process.env = {
    ...originalEnv,
    BANK_TOKEN_ENCRYPTION_KEY: crypto.randomBytes(32).toString('base64'),
  }
  jest.clearAllMocks()
  ;(getFinalBalances as jest.Mock).mockResolvedValue({ balances: [] })
  ;(getBankDates as jest.Mock).mockResolvedValue('2026-11-03')
  ;(getFinalTransactions as jest.Mock).mockResolvedValue([])
  ;(getTransactionsForDateInterval as jest.Mock).mockResolvedValue([])

  for (const [id, token] of [
    [OWN, OWN_TOKEN],
    [FOREIGN, FOREIGN_TOKEN],
  ]) {
    await Domain.updateOne(
      { _id: id },
      {
        $set: {
          domainBankToken: [
            { token: encryptBankToken(token), shortToken: 'own***ken' },
          ],
        },
      }
    )
  }
})
afterAll(() => {
  process.env = originalEnv
})

const call = async (
  handler: (req: any, res: any) => Promise<unknown>,
  {
    method = 'GET',
    query = {},
    headers = {},
  }: { method?: string; query?: any; headers?: any } = {}
) => {
  const res: any = { writableEnded: false }
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => {
    res.writableEnded = true
    return res
  })
  await handler({ method, query, headers }, res)
  return {
    status: res.status.mock.calls[0]?.[0],
    body: res.json.mock.calls[0]?.[0],
  }
}

describe.each([
  ['balances', balancesHandler, getFinalBalances],
  ['date', dateHandler, getBankDates],
  ['transactions', transactionsHandler, getTransactionsForDateInterval],
  ['transactions/final', finalTransactionsHandler, getFinalTransactions],
])('/api/bankapi/%s', (_name, handler, bankCall) => {
  it('is closed without a session', async () => {
    const { status } = await call(handler, { query: { domainId: OWN } })

    expect(status).toBe(401)
    expect(bankCall).not.toHaveBeenCalled()
  })

  it('is closed to a plain user', async () => {
    await mockLoginAs(users.user)

    const { status } = await call(handler, { query: { domainId: OWN } })

    expect(status).toBe(403)
    expect(bankCall).not.toHaveBeenCalled()
  })

  it("does not let a DomainAdmin use another domain's token", async () => {
    await mockLoginAs(users.domainAdmin)

    // A token in the request used to be all it took; it is not read anymore.
    const { status } = await call(handler, {
      query: { domainId: FOREIGN, token: OWN_TOKEN },
      headers: { token: OWN_TOKEN },
    })

    expect(status).toBe(403)
    expect(bankCall).not.toHaveBeenCalled()
  })

  it('needs a domainId - a token in the request is not enough', async () => {
    await mockLoginAs(users.globalAdmin)

    const { status } = await call(handler, { headers: { token: OWN_TOKEN } })

    expect(status).toBe(400)
    expect(bankCall).not.toHaveBeenCalled()
  })

  it('reports a domain without a bank token', async () => {
    await mockLoginAs(users.globalAdmin)

    const { status } = await call(handler, {
      query: { domainId: String(domains[2]._id) },
    })

    expect(status).toBe(404)
    expect(bankCall).not.toHaveBeenCalled()
  })

  it("calls the bank with the domain's own token, decrypted on the server", async () => {
    await mockLoginAs(users.domainAdmin)

    const { status, body } = await call(handler, {
      query: { domainId: OWN, acc: 'UA00' },
      headers: { token: FOREIGN_TOKEN },
    })

    expect(status).toBe(200)
    expect(body.success).toBe(true)
    expect((bankCall as jest.Mock).mock.calls[0][0]).toBe(OWN_TOKEN)
    expect(JSON.stringify(body)).not.toContain(OWN_TOKEN)
  })

  // No login here on purpose: the method is checked before the session, so a
  // queued mockLoginAs would leak into the next test.
  it('only answers GET', async () => {
    const { status } = await call(handler, {
      method: 'POST',
      query: { domainId: OWN },
    })

    expect(status).toBe(405)
    expect(bankCall).not.toHaveBeenCalled()
  })
})
