import crypto from 'crypto'
import CryptoJS from 'crypto-js'
import {
  BankTokenConfigError,
  decryptBankToken,
  encryptBankToken,
  isLegacyBankToken,
} from './bankTokenCrypto'

const KEY = crypto.randomBytes(32).toString('base64')
const LEGACY_KEY = 'legacy-test-key'
const TOKEN = 'privatbank-token-0123456789abcdef'

const originalEnv = process.env

beforeEach(() => {
  process.env = {
    ...originalEnv,
    BANK_TOKEN_ENCRYPTION_KEY: KEY,
    LEGACY_BANK_TOKEN_KEY: LEGACY_KEY,
  }
  delete process.env.NEXT_PUBLIC_MONGODB_SECRET_TOKEN
})

afterAll(() => {
  process.env = originalEnv
})

describe('encryptBankToken / decryptBankToken', () => {
  it('round-trips a token', () => {
    expect(decryptBankToken(encryptBankToken(TOKEN))).toBe(TOKEN)
  })

  it('stores a v2 value that does not reveal the token', () => {
    const stored = encryptBankToken(TOKEN)

    expect(stored.startsWith('v2:')).toBe(true)
    expect(isLegacyBankToken(stored)).toBe(false)
    expect(stored).not.toContain(TOKEN)
  })

  it('uses a fresh IV, so the same token encrypts differently each time', () => {
    expect(encryptBankToken(TOKEN)).not.toBe(encryptBankToken(TOKEN))
  })

  it('fails on a tampered value instead of returning garbage', () => {
    const raw = Buffer.from(encryptBankToken(TOKEN).slice(3), 'base64')
    raw[raw.length - 1] ^= 0xff

    expect(() => decryptBankToken('v2:' + raw.toString('base64'))).toThrow(
      'bank token could not be decrypted'
    )
  })

  it('fails under a different key', () => {
    const stored = encryptBankToken(TOKEN)
    process.env.BANK_TOKEN_ENCRYPTION_KEY = crypto
      .randomBytes(32)
      .toString('base64')

    expect(() => decryptBankToken(stored)).toThrow(
      'bank token could not be decrypted'
    )
  })

  it('needs a 32-byte key', () => {
    delete process.env.BANK_TOKEN_ENCRYPTION_KEY
    expect(() => encryptBankToken(TOKEN)).toThrow(BankTokenConfigError)

    process.env.BANK_TOKEN_ENCRYPTION_KEY =
      Buffer.from('short').toString('base64')
    expect(() => encryptBankToken(TOKEN)).toThrow(BankTokenConfigError)
  })

  it('does not put the token or the key in its errors', () => {
    const stored = encryptBankToken(TOKEN)
    process.env.BANK_TOKEN_ENCRYPTION_KEY = crypto
      .randomBytes(32)
      .toString('base64')

    try {
      decryptBankToken(stored)
      throw new Error('expected a failure')
    } catch (error) {
      const message = (error as Error).message
      expect(message).not.toContain(TOKEN)
      expect(message).not.toContain(KEY)
    }
  })

  it('refuses an empty token', () => {
    expect(() => encryptBankToken('')).toThrow('bank token is empty')
    expect(() => decryptBankToken('')).toThrow('bank token is empty')
  })
})

describe('legacy values (old CryptoJS EncryptionService)', () => {
  const legacy = (plain: string, key = LEGACY_KEY) =>
    CryptoJS.AES.encrypt(plain, key).toString()

  it('still reads a token the old service wrote', () => {
    const stored = legacy(TOKEN)

    expect(isLegacyBankToken(stored)).toBe(true)
    expect(decryptBankToken(stored)).toBe(TOKEN)
  })

  it('falls back to the NEXT_PUBLIC_ key name the old service used', () => {
    delete process.env.LEGACY_BANK_TOKEN_KEY
    process.env.NEXT_PUBLIC_MONGODB_SECRET_TOKEN = LEGACY_KEY

    expect(decryptBankToken(legacy(TOKEN))).toBe(TOKEN)
  })

  it('reports a missing legacy key as a configuration error', () => {
    delete process.env.LEGACY_BANK_TOKEN_KEY

    expect(() => decryptBankToken(legacy(TOKEN))).toThrow(BankTokenConfigError)
  })

  // The old service decrypted 'invalid-data' with a random salt, so now and
  // then the result passed as UTF-8 and came back as a "token". It must fail
  // every single time.
  it('rejects data that was never CryptoJS output, every time', () => {
    for (let i = 0; i < 200; i++) {
      expect(() => decryptBankToken('invalid-data')).toThrow(
        'bank token is malformed'
      )
    }
  })
})
