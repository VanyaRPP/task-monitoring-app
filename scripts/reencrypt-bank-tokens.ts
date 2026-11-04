/**
 * Re-encrypt the PrivatBank tokens stored on domains under the server-only key.
 *
 * Tokens saved before were CryptoJS output keyed with
 * NEXT_PUBLIC_MONGODB_SECRET_TOKEN - a key that shipped in the client bundle.
 * This moves every such token to the v2 format (AES-256-GCM under
 * BANK_TOKEN_ENCRYPTION_KEY, see bankTokenCrypto.ts). The app reads both
 * formats, so it keeps working before, during and after the run.
 *
 * Dry run by default - reports what it would change and writes nothing:
 *   npx tsx --env-file=.env.local scripts/reencrypt-bank-tokens.ts
 * Write the changes:
 *   npx tsx --env-file=.env.local scripts/reencrypt-bank-tokens.ts --apply
 *
 * Needs BANK_TOKEN_ENCRYPTION_KEY and the old key (LEGACY_BANK_TOKEN_KEY or
 * NEXT_PUBLIC_MONGODB_SECRET_TOKEN). Idempotent: v2 values are left as they
 * are. A domain is only rewritten when every legacy token in it decrypts to a
 * value matching its stored shortToken; anything else is reported and left
 * untouched. Never prints a token, only domain ids.
 *
 * The `--env-file` flag is required because dbConnect.ts validates
 * MONGODB_URI at module-load time, before any in-script dotenv call.
 */
/* eslint-disable no-console */
import dbConnect from '../utils/dbConnect'
import Domain from '../common/modules/models/Domain'
import {
  decryptBankToken,
  encryptBankToken,
  isLegacyBankToken,
} from '../common/services/bankTokenService/bankTokenCrypto'
import { hidePercentCharacters } from '../utils/hidePercentCharacters/hidePercentCharacters'
import mongoose from 'mongoose'

export interface IReencryptReport {
  /** Domains whose legacy tokens were (or, in a dry run, would be) rewritten. */
  updated: string[]
  /** Domains whose tokens are all v2 already. */
  current: string[]
  /** Domains left untouched: a token would not decrypt, or it changed meanwhile. */
  failed: { domainId: string; reason: string }[]
}

const isLegacy = (token: unknown): token is string =>
  typeof token === 'string' && token.length > 0 && isLegacyBankToken(token)

/**
 * The legacy token of one entry, decrypted and checked against the masked
 * copy saved next to it.
 *
 * CryptoJS has no integrity check: under a wrong key it strips "padding" by a
 * random byte and ~0.45% of the time the few bytes left pass as UTF-8. Without
 * this check `--apply` with the wrong LEGACY_BANK_TOKEN_KEY would replace about
 * one stored token in 200 with garbage, for good. `shortToken` keeps the
 * length and at least 6 characters of the real token, so garbage cannot match.
 */
function decryptVerified(entry: { token?: string; shortToken?: string }) {
  if (typeof entry.shortToken !== 'string' || entry.shortToken === '') {
    throw new Error('no shortToken to verify the decrypted token against')
  }
  const plain = decryptBankToken(entry.token as string)
  if (hidePercentCharacters(plain) !== entry.shortToken) {
    throw new Error(
      'decrypted token does not match its shortToken (wrong legacy key?)'
    )
  }
  return plain
}

export async function reencryptBankTokens(
  { apply = false }: { apply?: boolean } = {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  log: (msg: string) => void = () => {}
): Promise<IReencryptReport> {
  const report: IReencryptReport = { updated: [], current: [], failed: [] }

  const domains = await Domain.find({
    'domainBankToken.token': { $exists: true },
  })
    .select('+domainBankToken.token')
    .lean()

  for (const domain of domains) {
    const domainId = String(domain._id)
    const entries = domain.domainBankToken ?? []
    const legacyTokens = entries.map((e) => e?.token).filter(isLegacy)

    if (legacyTokens.length === 0) {
      report.current.push(domainId)
      continue
    }

    let next: typeof entries
    try {
      next = entries.map((entry) =>
        isLegacy(entry?.token)
          ? { ...entry, token: encryptBankToken(decryptVerified(entry)) }
          : entry
      )
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'unknown error'
      report.failed.push({ domainId, reason })
      log(`[reencrypt] domain ${domainId}: skipped - ${reason}`)
      continue
    }

    if (apply) {
      // Only if the legacy values read above are all still there, so a token
      // edited in the meantime is not overwritten with the old one.
      const { modifiedCount } = await Domain.updateOne(
        { _id: domain._id, 'domainBankToken.token': { $all: legacyTokens } },
        { $set: { domainBankToken: next } }
      )
      if (modifiedCount === 0) {
        report.failed.push({ domainId, reason: 'changed meanwhile, run again' })
        log(`[reencrypt] domain ${domainId}: changed meanwhile, run again`)
        continue
      }
    }

    report.updated.push(domainId)
    log(
      `[reencrypt] domain ${domainId}: ${legacyTokens.length} token(s) ${
        apply ? 're-encrypted' : 'would be re-encrypted'
      }`
    )
  }

  return report
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply')
  await dbConnect()
  const report = await reencryptBankTokens({ apply }, console.log)
  console.log(
    `[reencrypt] ${apply ? 'applied' : 'dry run'}: ${report.updated.length} updated, ` +
      `${report.current.length} already current, ${report.failed.length} failed`
  )
  if (!apply && report.updated.length > 0) {
    console.log('[reencrypt] run again with --apply to write the changes')
  }
  if (report.failed.length > 0) process.exitCode = 1
}

if (require.main === module) {
  main()
    .then(() => mongoose.disconnect())
    .catch(async (err) => {
      console.error(
        '[reencrypt] failed',
        err instanceof Error ? err.message : 'unknown'
      )
      await mongoose.disconnect()
      process.exit(1)
    })
}
