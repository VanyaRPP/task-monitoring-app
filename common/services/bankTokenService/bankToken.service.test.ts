import crypto from 'crypto'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import { setupTestEnvironment } from '@utils/setupTestEnvironment'
import { domains, users } from '@utils/testData'
import { decryptBankToken, encryptBankToken } from './bankTokenCrypto'
import {
  getDomainBankToken,
  loadStoredBankTokens,
  prepareDomainBankTokens,
  withoutBankTokenSecrets,
} from './bankToken.service'

setupTestEnvironment()

const originalEnv = process.env
beforeEach(() => {
  process.env = {
    ...originalEnv,
    BANK_TOKEN_ENCRYPTION_KEY: crypto.randomBytes(32).toString('base64'),
  }
})
afterAll(() => {
  process.env = originalEnv
})

const OWN = String(domains[0]._id) // administered by users.domainAdmin
const FOREIGN = String(domains[1]._id)

const storeToken = (domainId: string, plain: string) =>
  Domain.updateOne(
    { _id: domainId },
    {
      $set: {
        domainBankToken: [
          {
            token: encryptBankToken(plain),
            shortToken: 'abc*****xyz',
            name: 'main',
            confidant: [],
          },
        ],
      },
    }
  )

describe('Domain model - the encrypted token stays on the server', () => {
  beforeEach(() => storeToken(OWN, 'own-token'))

  it('is left out of every ordinary query result', async () => {
    const lean = await Domain.findById(OWN).lean()
    const json = JSON.parse(JSON.stringify(await Domain.findById(OWN)))
    const updated = await Domain.findOneAndUpdate(
      { _id: OWN },
      { description: 'changed' },
      { returnDocument: 'after' }
    ).lean()
    const company: any = await RealEstate.findOne({ domain: OWN })
      .populate('domain')
      .lean()

    for (const domain of [lean, json, updated, company.domain]) {
      expect(domain.domainBankToken).toHaveLength(1)
      expect(domain.domainBankToken[0]).not.toHaveProperty('token')
      expect(domain.domainBankToken[0].shortToken).toBe('abc*****xyz')
    }
  })

  it('is returned when asked for explicitly', async () => {
    const [entry] = await loadStoredBankTokens(OWN)

    expect(decryptBankToken(entry.token as string)).toBe('own-token')
  })

  it('survives saving a document loaded without it', async () => {
    const doc = await Domain.findById(OWN)
    doc.description = 'saved'
    await doc.save()

    const [entry] = await loadStoredBankTokens(OWN)
    expect(decryptBankToken(entry.token as string)).toBe('own-token')
  })
})

describe('prepareDomainBankTokens', () => {
  const stored = [
    {
      token: 'v2:stored-ciphertext',
      shortToken: 'abc*****xyz',
      name: 'main',
      confidant: ['a@example.com'],
    },
  ]

  it('leaves stored tokens alone when the form sent none', () => {
    expect(prepareDomainBankTokens(undefined, stored)).toBeUndefined()
    expect(prepareDomainBankTokens([], stored)).toBeUndefined()
    expect(prepareDomainBankTokens('x', stored)).toBeUndefined()
  })

  it('encrypts a newly typed token and stores only its masked form beside it', () => {
    const [entry] = prepareDomainBankTokens(
      [{ shortToken: '  new-plain-token-1234  ', name: 'second' }],
      stored
    ) as any[]

    expect(decryptBankToken(entry.token)).toBe('new-plain-token-1234')
    expect(entry.shortToken).toContain('*')
    expect(entry.shortToken).not.toBe('new-plain-token-1234')
    expect(entry.name).toBe('second')
  })

  it('maps a re-submitted masked entry back to its stored token', () => {
    const [entry] = prepareDomainBankTokens(
      [{ shortToken: 'abc*****xyz', name: 'main', confidant: [] }],
      stored
    ) as any[]

    expect(entry.token).toBe('v2:stored-ciphertext')
    expect(entry.confidant).toEqual([]) // other edits from the form apply
  })

  it('ignores a token sent by the client', () => {
    const [created] = prepareDomainBankTokens(
      [{ token: 'v2:forged', shortToken: 'typed-token-5678' }],
      []
    ) as any[]
    expect(created.token).not.toBe('v2:forged')
    expect(decryptBankToken(created.token)).toBe('typed-token-5678')

    // Masked, with a forged ciphertext and nothing stored to match: dropped.
    expect(
      prepareDomainBankTokens(
        [{ token: 'v2:forged', shortToken: 'zzz*****zzz' }],
        stored
      )
    ).toEqual([])
  })

  it('does not match entries just because neither has a name', () => {
    const unnamed = [{ token: 'v2:unnamed', shortToken: 'qqq*****qqq' }]

    expect(
      prepareDomainBankTokens([{ shortToken: 'zzz*****zzz' }], unnamed)
    ).toEqual([])
  })

  it('drops entries without a token', () => {
    expect(prepareDomainBankTokens([{ name: 'x' }, null], stored)).toEqual([])
  })
})

describe('withoutBankTokenSecrets', () => {
  it('drops the encrypted token and keeps the rest', () => {
    expect(
      withoutBankTokenSecrets({
        name: 'd',
        domainBankToken: [{ token: 'v2:x', shortToken: 'a***b', name: 'n' }],
      })
    ).toEqual({
      name: 'd',
      domainBankToken: [{ shortToken: 'a***b', name: 'n' }],
    })
  })
})

describe('getDomainBankToken', () => {
  beforeEach(async () => {
    await storeToken(OWN, 'own-token')
    await storeToken(FOREIGN, 'foreign-token')
  })

  const as = (user: { email: string }, role: 'global' | 'domain' | 'user') => ({
    user,
    isGlobalAdmin: role === 'global',
    isDomainAdmin: role === 'domain',
  })

  it('gives a GlobalAdmin the token of any domain', async () => {
    await expect(
      getDomainBankToken(as(users.globalAdmin, 'global'), FOREIGN)
    ).resolves.toEqual({ ok: true, token: 'foreign-token' })
  })

  it('gives a DomainAdmin the token of their own domain only', async () => {
    const access = as(users.domainAdmin, 'domain')

    await expect(getDomainBankToken(access, OWN)).resolves.toEqual({
      ok: true,
      token: 'own-token',
    })
    await expect(getDomainBankToken(access, FOREIGN)).resolves.toMatchObject({
      ok: false,
      code: 'forbidden',
    })
  })

  it('gives a plain user nothing', async () => {
    await expect(
      getDomainBankToken(as(users.user, 'user'), OWN)
    ).resolves.toMatchObject({ ok: false, code: 'forbidden' })
  })

  it('rejects a missing or malformed domainId', async () => {
    const access = as(users.globalAdmin, 'global')

    for (const id of [undefined, '', 'not-an-id', ['a', 'b']]) {
      await expect(getDomainBankToken(access, id)).resolves.toMatchObject({
        ok: false,
        code: 'invalid',
      })
    }
  })

  it('reports a domain without a token', async () => {
    await expect(
      getDomainBankToken(
        as(users.globalAdmin, 'global'),
        String(domains[2]._id)
      )
    ).resolves.toMatchObject({ ok: false, code: 'not_found' })
  })
})
