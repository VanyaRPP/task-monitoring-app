import { expect } from '@jest/globals'
import crypto from 'crypto'
import mongoose from 'mongoose'
import Domain from '@modules/models/Domain'
import {
  decryptBankToken,
  encryptBankToken,
} from '@common/services/bankTokenService/bankTokenCrypto'
import { loadStoredBankTokens } from '@common/services/bankTokenService/bankToken.service'
import domainByIdHandler from '@pages/api/domain/[id]/index'
import domainsHandler from '@pages/api/domain/index'
import adminDomainsHandler from '@pages/api/domain/admin/index'
import { mockLoginAs } from '@utils/mockLoginAs'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, streets, users } from '@utils/testData'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@pages/api/auth/[...nextauth]', () => ({ authOptions: {} }))
jest.mock('@pages/api/api.config', () => jest.fn())

setupTestEnvironment()

const OWN = String(domains[0]._id) // administered by users.domainAdmin
const STORED_PLAIN = 'stored-privatbank-token-0001'

const originalEnv = process.env
let storedCiphertext: string

beforeEach(async () => {
  process.env = {
    ...originalEnv,
    BANK_TOKEN_ENCRYPTION_KEY: crypto.randomBytes(32).toString('base64'),
  }
  storedCiphertext = encryptBankToken(STORED_PLAIN)
  // Raw write, the way older entries sit in the collection - including a
  // field the schema does not declare.
  await Domain.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(OWN) },
    {
      $set: {
        domainBankToken: [
          {
            token: storedCiphertext,
            shortToken: 'sto*******001',
            name: 'main',
            confidant: [],
            legacyField: 'keep me',
          },
        ],
      },
    }
  )
})
afterAll(() => {
  process.env = originalEnv
})

const call = async (handler: any, req: any) => {
  const res: any = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  await handler(req, res)
  return {
    status: res.status.mock.calls[0]?.[0],
    data: JSON.parse(JSON.stringify(res.json.mock.calls[0]?.[0]?.data ?? null)),
  }
}

describe('domain API never sends the encrypted bank token', () => {
  it('GET /api/domain/[id]', async () => {
    await mockLoginAs(users.domainAdmin)

    const { status, data } = await call(domainByIdHandler, {
      method: 'GET',
      query: { id: OWN },
    })

    expect(status).toBe(200)
    expect(data.domainBankToken[0]).not.toHaveProperty('token')
    expect(data.domainBankToken[0].shortToken).toBe('sto*******001')
    expect(JSON.stringify(data)).not.toContain(storedCiphertext)
  })

  it('GET /api/domain/admin', async () => {
    await mockLoginAs(users.globalAdmin)

    const { status, data } = await call(adminDomainsHandler, {
      method: 'GET',
      query: {},
    })

    expect(status).toBe(200)
    expect(JSON.stringify(data)).not.toContain(storedCiphertext)
  })
})

describe('PATCH /api/domain/[id] - bank tokens', () => {
  const patch = async (body: any) => {
    await mockLoginAs(users.domainAdmin)
    return call(domainByIdHandler, {
      method: 'PATCH',
      query: { id: OWN },
      body: { ...domains[0], ...body },
    })
  }

  it('keeps the stored token when the form re-submits what GET gave it', async () => {
    await mockLoginAs(users.domainAdmin)
    const loaded = await call(domainByIdHandler, {
      method: 'GET',
      query: { id: OWN },
    })

    const { status, data } = await patch({
      description: 'edited',
      domainBankToken: loaded.data.domainBankToken,
    })

    expect(status).toBe(200)
    expect(data.domainBankToken[0]).not.toHaveProperty('token')
    const [entry] = await loadStoredBankTokens(OWN)
    expect(decryptBankToken(entry.token as string)).toBe(STORED_PLAIN)
    expect((entry as any).legacyField).toBe('keep me')
  })

  it('leaves stored tokens alone when the form sends none', async () => {
    await patch({ description: 'edited', domainBankToken: [] })

    const [entry] = await loadStoredBankTokens(OWN)
    expect(entry.token).toBe(storedCiphertext)
  })

  it('encrypts a newly typed token and ignores a token sent by the client', async () => {
    await patch({
      domainBankToken: [
        { shortToken: 'brand-new-token-9999', name: 'new', token: 'v2:forged' },
      ],
    })

    const [entry] = await loadStoredBankTokens(OWN)
    expect(entry.token).not.toBe('v2:forged')
    expect(decryptBankToken(entry.token as string)).toBe('brand-new-token-9999')
    expect(entry.shortToken).not.toBe('brand-new-token-9999')
  })

  it("cannot plant someone else's ciphertext under a masked entry", async () => {
    await patch({
      domainBankToken: [
        { shortToken: 'xxx*******xxx', name: 'other', token: 'v2:forged' },
      ],
    })

    expect(await loadStoredBankTokens(OWN)).toEqual([])
  })
})

describe('POST /api/domain - bank tokens', () => {
  it('stores the typed token encrypted and responds without it', async () => {
    await mockLoginAs(users.domainAdmin)

    const { status, data } = await call(domainsHandler, {
      method: 'POST',
      query: {},
      body: {
        name: 'new domain with bank',
        description: 'd',
        adminEmails: [users.domainAdmin.email],
        streets: [streets[0]._id],
        domainBankToken: [
          {
            shortToken: 'created-token-4242',
            name: 'main',
            token: 'v2:forged',
          },
        ],
      },
    })

    expect(status).toBe(201)
    expect(data.domainBankToken[0]).not.toHaveProperty('token')
    expect(JSON.stringify(data)).not.toContain('created-token-4242')

    const [entry] = await loadStoredBankTokens(data._id)
    expect(decryptBankToken(entry.token as string)).toBe('created-token-4242')
  })
})
