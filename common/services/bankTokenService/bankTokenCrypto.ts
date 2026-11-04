import crypto from 'crypto'
import CryptoJS from 'crypto-js'

/**
 * Encryption of the PrivatBank tokens stored on a Domain. Server only.
 *
 * New values are AES-256-GCM under `BANK_TOKEN_ENCRYPTION_KEY` (32 random
 * bytes, base64), stored as `v2:<base64 of iv | auth tag | ciphertext>`. GCM
 * authenticates the data, so a damaged value or the wrong key fails loudly
 * instead of decrypting into garbage.
 *
 * Values written before this module are CryptoJS passphrase output, keyed
 * with the old `NEXT_PUBLIC_MONGODB_SECRET_TOKEN`. That key was shipped in the
 * client bundle, so it protects nothing; it is still read here, on the server,
 * only so existing tokens keep working until
 * `scripts/reencrypt-bank-tokens.ts` has moved them to v2. Set
 * `LEGACY_BANK_TOKEN_KEY` to the same value to drop the NEXT_PUBLIC_ name.
 *
 * Errors never include the token or the key.
 */

const V2_PREFIX = 'v2:'
const IV_BYTES = 12
const TAG_BYTES = 16
const KEY_BYTES = 32
/** base64 of "Salted__", the header CryptoJS writes before salt + data. */
const LEGACY_PREFIX = 'U2FsdGVkX1'

export class BankTokenConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BankTokenConfigError'
  }
}

function getKey(): Buffer {
  const raw = process.env.BANK_TOKEN_ENCRYPTION_KEY
  if (!raw) {
    throw new BankTokenConfigError('BANK_TOKEN_ENCRYPTION_KEY is not set')
  }
  const key = Buffer.from(raw, 'base64')
  if (key.length !== KEY_BYTES) {
    throw new BankTokenConfigError(
      'BANK_TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded'
    )
  }
  return key
}

function getLegacyKey(): string {
  const key =
    process.env.LEGACY_BANK_TOKEN_KEY ||
    process.env.NEXT_PUBLIC_MONGODB_SECRET_TOKEN
  if (!key) {
    throw new BankTokenConfigError(
      'no key for legacy bank tokens (LEGACY_BANK_TOKEN_KEY)'
    )
  }
  return key
}

export function encryptBankToken(plain: string): string {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new Error('bank token is empty')
  }
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return V2_PREFIX + Buffer.concat([iv, tag, data]).toString('base64')
}

/** True for values that still need `scripts/reencrypt-bank-tokens.ts`. */
export function isLegacyBankToken(stored: string): boolean {
  return !stored.startsWith(V2_PREFIX)
}

function decryptV2(stored: string): string {
  const raw = Buffer.from(stored.slice(V2_PREFIX.length), 'base64')
  if (raw.length <= IV_BYTES + TAG_BYTES) {
    throw new Error('bank token is malformed')
  }
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getKey(),
    raw.subarray(0, IV_BYTES)
  )
  decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES))
  try {
    return Buffer.concat([
      decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    throw new Error('bank token could not be decrypted')
  }
}

function decryptLegacy(stored: string): string {
  // Without the "Salted__" header CryptoJS makes up a random salt and returns
  // random bytes - which now and then pass as UTF-8. Reject those up front.
  if (!stored.startsWith(LEGACY_PREFIX)) {
    throw new Error('bank token is malformed')
  }
  let plain = ''
  try {
    plain = CryptoJS.AES.decrypt(stored, getLegacyKey()).toString(
      CryptoJS.enc.Utf8
    )
  } catch (error) {
    if (error instanceof BankTokenConfigError) throw error
    plain = ''
  }
  if (!plain) throw new Error('bank token could not be decrypted')
  return plain
}

export function decryptBankToken(stored: string): string {
  if (typeof stored !== 'string' || stored.length === 0) {
    throw new Error('bank token is empty')
  }
  return isLegacyBankToken(stored) ? decryptLegacy(stored) : decryptV2(stored)
}
