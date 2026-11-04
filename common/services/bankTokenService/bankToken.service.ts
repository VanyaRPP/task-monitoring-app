import Domain, { IDomainBankToken } from '@modules/models/Domain'
import { canEditDomain, IDomainAccessUser } from '@utils/domain/domain-access'
import { hidePercentCharacters } from '@utils/hidePercentCharacters/hidePercentCharacters'
import mongoose from 'mongoose'
import { decryptBankToken, encryptBankToken } from './bankTokenCrypto'

export type BankTokenErrorCode = 'invalid' | 'forbidden' | 'not_found'

export type BankTokenResult =
  | { ok: true; token: string }
  | { ok: false; code: BankTokenErrorCode; message: string }

/** A domain's stored bank tokens, including the encrypted `token`. */
export async function loadStoredBankTokens(
  domainId: unknown
): Promise<IDomainBankToken[]> {
  if (typeof domainId !== 'string' || !mongoose.isValidObjectId(domainId)) {
    return []
  }
  const domain = await Domain.findById(domainId)
    .select('+domainBankToken.token')
    .lean()
  return domain?.domainBankToken ?? []
}

/**
 * What to store for the bank tokens a domain form submitted, or `undefined`
 * to leave the stored ones alone (an empty or missing field must not wipe a
 * domain's PrivatBank integration on an unrelated PATCH).
 *
 * The browser never has the encrypted `token`. An entry it re-submits
 * unchanged carries only the masked `shortToken` and is matched back to the
 * stored one; an entry with an unmasked `shortToken` is a new token typed into
 * the form. A `token` sent by the client is always ignored - the server is the
 * only one that produces it.
 */
export function prepareDomainBankTokens(
  incoming: unknown,
  existing: IDomainBankToken[]
): IDomainBankToken[] | undefined {
  if (!Array.isArray(incoming) || incoming.length === 0) return undefined

  return incoming.flatMap((item): IDomainBankToken[] => {
    if (!item || typeof item !== 'object') return []
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { token: _fromClient, ...rest } = item as IDomainBankToken
    const shortToken =
      typeof rest.shortToken === 'string' ? rest.shortToken.trim() : ''
    if (!shortToken) return []

    if (shortToken.includes('*')) {
      const matched = existing.find(
        (e) =>
          e?.shortToken === shortToken || (!!rest.name && e?.name === rest.name)
      )
      // Masked, but nothing stored to match it to: the original token cannot
      // be recovered, so drop the entry rather than persist a bogus one.
      if (!matched?.token) return []
      return [{ ...rest, token: matched.token, shortToken: matched.shortToken }]
    }

    return [
      {
        ...rest,
        token: encryptBankToken(shortToken),
        shortToken: hidePercentCharacters(shortToken),
      },
    ]
  })
}

/** Copy of a domain for an API response, without the encrypted tokens. */
export function withoutBankTokenSecrets<
  T extends { domainBankToken?: unknown },
>(domain: T): T {
  if (!Array.isArray(domain?.domainBankToken)) return domain
  return {
    ...domain,
    domainBankToken: domain.domainBankToken.map((entry) => {
      if (!entry || typeof entry !== 'object') return entry
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { token, ...rest } = entry as IDomainBankToken
      return rest
    }),
  }
}

/**
 * The decrypted PrivatBank token of a domain, for the caller in `access`.
 * Only admins of that domain (or a GlobalAdmin) get it - the same rule as
 * editing the domain. The token is used server-side and never returned to the
 * browser.
 */
export async function getDomainBankToken(
  access: IDomainAccessUser,
  domainId: unknown
): Promise<BankTokenResult> {
  if (typeof domainId !== 'string' || !mongoose.isValidObjectId(domainId)) {
    return { ok: false, code: 'invalid', message: 'Некоректний domainId' }
  }
  if (!(await canEditDomain(access, domainId))) {
    return { ok: false, code: 'forbidden', message: 'Немає доступу до домену' }
  }

  const stored = (await loadStoredBankTokens(domainId)).find(
    (entry) => typeof entry?.token === 'string' && entry.token.length > 0
  )?.token
  if (!stored) {
    return {
      ok: false,
      code: 'not_found',
      message: 'Для домену не налаштовано токен банку',
    }
  }

  return { ok: true, token: decryptBankToken(stored) }
}
