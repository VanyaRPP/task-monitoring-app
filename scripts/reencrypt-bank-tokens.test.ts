import crypto from 'crypto'
import CryptoJS from 'crypto-js'
import mongoose from 'mongoose'
import Domain from '../common/modules/models/Domain'
import {
  decryptBankToken,
  encryptBankToken,
  isLegacyBankToken,
} from '../common/services/bankTokenService/bankTokenCrypto'
import { loadStoredBankTokens } from '../common/services/bankTokenService/bankToken.service'
import { setupTestEnvironment } from '../utils/setupTestEnvironment'
import { domains } from '../utils/testData'
import { hidePercentCharacters } from '../utils/hidePercentCharacters/hidePercentCharacters'
import { reencryptBankTokens } from './reencrypt-bank-tokens'

setupTestEnvironment()

const LEGACY_KEY = 'legacy-test-key'
const LEGACY_ID = String(domains[0]._id)
const CURRENT_ID = String(domains[1]._id)
const BROKEN_ID = String(domains[2]._id)
const NO_MASK_ID = String(domains[3]._id)

const originalEnv = process.env
let currentCiphertext: string

const rawSet = (id: string, entries: unknown[]) =>
  Domain.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: { domainBankToken: entries } }
  )

beforeEach(async () => {
  process.env = {
    ...originalEnv,
    BANK_TOKEN_ENCRYPTION_KEY: crypto.randomBytes(32).toString('base64'),
    LEGACY_BANK_TOKEN_KEY: LEGACY_KEY,
  }
  currentCiphertext = encryptBankToken('already-v2')

  await rawSet(LEGACY_ID, [
    {
      token: CryptoJS.AES.encrypt('legacy-one', LEGACY_KEY).toString(),
      shortToken: hidePercentCharacters('legacy-one'),
      name: 'first',
      legacyField: 'keep me',
    },
    { token: currentCiphertext, shortToken: 'alr*****-v2', name: 'second' },
  ])
  await rawSet(CURRENT_ID, [
    { token: currentCiphertext, shortToken: 'alr*****-v2' },
  ])
  await rawSet(BROKEN_ID, [
    // Legacy format, but under some other key: must not be "fixed". CryptoJS
    // has no integrity check, so ~0.45% of the time the wrong key still yields
    // a short "token" - the shortToken check is what stops it, every time.
    {
      token: CryptoJS.AES.encrypt('x'.repeat(64), 'not-the-key').toString(),
      shortToken: hidePercentCharacters('x'.repeat(64)),
    },
  ])
  await rawSet(NO_MASK_ID, [
    { token: CryptoJS.AES.encrypt('no-mask-token', LEGACY_KEY).toString() },
  ])
})
afterAll(() => {
  process.env = originalEnv
})

describe('reencryptBankTokens', () => {
  it('writes nothing in a dry run', async () => {
    const before = await loadStoredBankTokens(LEGACY_ID)

    const report = await reencryptBankTokens()

    expect(report.updated).toEqual([LEGACY_ID])
    expect(await loadStoredBankTokens(LEGACY_ID)).toEqual(before)
  })

  it('moves legacy tokens to v2 and keeps everything else', async () => {
    const report = await reencryptBankTokens({ apply: true })

    expect(report.updated).toEqual([LEGACY_ID])
    expect(report.current).toEqual([CURRENT_ID])

    const [first, second] = await loadStoredBankTokens(LEGACY_ID)
    expect(isLegacyBankToken(first.token as string)).toBe(false)
    expect(decryptBankToken(first.token as string)).toBe('legacy-one')
    expect(first).toMatchObject({
      shortToken: hidePercentCharacters('legacy-one'),
      name: 'first',
      legacyField: 'keep me',
    })
    expect(second.token).toBe(currentCiphertext)
  })

  it('leaves a domain alone when its token will not decrypt', async () => {
    const before = await loadStoredBankTokens(BROKEN_ID)

    const report = await reencryptBankTokens({ apply: true })

    expect(report.failed.map((f) => f.domainId)).toContain(BROKEN_ID)
    expect(report.updated).not.toContain(BROKEN_ID)
    expect(await loadStoredBankTokens(BROKEN_ID)).toEqual(before)
  })

  // The wrong-key case above passes the decrypt step ~0.45% of the time;
  // 1500 runs catch a missing shortToken check with ~99.9% certainty.
  it('never rewrites a token decrypted under the wrong key', async () => {
    for (let i = 0; i < 1500; i++) {
      await rawSet(BROKEN_ID, [
        {
          token: CryptoJS.AES.encrypt('x'.repeat(64), 'not-the-key').toString(),
          shortToken: hidePercentCharacters('x'.repeat(64)),
        },
      ])
      const report = await reencryptBankTokens()
      expect(report.updated).not.toContain(BROKEN_ID)
    }
  })

  it('leaves a token alone when there is no shortToken to check it against', async () => {
    const before = await loadStoredBankTokens(NO_MASK_ID)

    const report = await reencryptBankTokens({ apply: true })

    expect(report.failed.map((f) => f.domainId)).toContain(NO_MASK_ID)
    expect(await loadStoredBankTokens(NO_MASK_ID)).toEqual(before)
  })

  it('is a no-op the second time', async () => {
    await reencryptBankTokens({ apply: true })
    const after = await loadStoredBankTokens(LEGACY_ID)

    const report = await reencryptBankTokens({ apply: true })

    expect(report.updated).toEqual([])
    expect(report.current.sort()).toEqual([LEGACY_ID, CURRENT_ID].sort())
    expect(await loadStoredBankTokens(LEGACY_ID)).toEqual(after)
  })

  it('never logs a token', async () => {
    const lines: string[] = []
    await reencryptBankTokens({ apply: true }, (line) => lines.push(line))

    const logged = lines.join('\n')
    expect(logged).not.toContain('legacy-one')
    expect(logged).not.toContain(currentCiphertext)
  })
})
