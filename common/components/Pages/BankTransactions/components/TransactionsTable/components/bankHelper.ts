import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { ITransaction } from './transactionTypes'

export const normalizeTechnicalTransactionId = (
  id: string | undefined | null
): string => {
  if (!id || typeof id !== 'string') return ''
  return id.trim().replace(/_online$/, '')
}

export const buildFinalTechnicalTransactionId = (
  tx:
    | Pick<ITransaction, 'REF' | 'REFN' | 'DATE_TIME_DAT_OD_TIM_P'>
    | null
    | undefined
): string => {
  if (!tx?.REF || !tx?.REFN || !tx?.DATE_TIME_DAT_OD_TIM_P) return ''
  const m = String(tx.DATE_TIME_DAT_OD_TIM_P).match(
    /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/
  )
  if (!m) return ''
  const [, dd, mm, yyyy, hh, min, ss] = m
  return `${tx.REF}${tx.REFN}${dd}${mm}${yyyy}${hh}${min}${ss}`
}

export const technicalTransactionIdMatchCandidates = (
  tx:
    | Pick<
        ITransaction,
        'TECHNICAL_TRANSACTION_ID' | 'REF' | 'REFN' | 'DATE_TIME_DAT_OD_TIM_P'
      >
    | null
    | undefined
): string[] => {
  if (!tx) return []
  const incoming = (tx.TECHNICAL_TRANSACTION_ID || '').trim()
  const normalized = normalizeTechnicalTransactionId(incoming)
  const reconstructed = buildFinalTechnicalTransactionId(tx)
  return Array.from(
    new Set([incoming, normalized, reconstructed].filter(Boolean))
  )
}

export enum MatchType {
  ACCOUNT = 'account',
  RNOKPP = 'rnokpp',
  PREVIOUS = 'previous',
  NAME = 'name',
}

// Legal-form / wrapper tokens that carry no identity and must be stripped
// before comparing counterparty names.
const NAME_NOISE_TOKENS = new Set(['ФОП', 'КАРТКОВИЙ', 'ТОВ', 'ПП'])

/**
 * Normalizes a counterparty / company name for equality comparison: upper case,
 * punctuation removed, legal-form words dropped, whitespace collapsed.
 * "КАРТКОВИЙ - ФОП Петренко Петро Петрович" → "ПЕТРЕНКО ПЕТРО ПЕТРОВИЧ".
 */
export const normalizeCounterpartyName = (
  name: string | undefined | null
): string => {
  if (!name || typeof name !== 'string') return ''
  return name
    .toUpperCase()
    .replace(/[«»"'`.,/\\()\-–—]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && !NAME_NOISE_TOKENS.has(token))
    .join(' ')
    .trim()
}

/**
 * Builds a case-insensitive regex source that matches a counterparty name as
 * stored on past payments, regardless of ФОП/КАРТКОВИЙ prefixes or spacing:
 * "КАРТКОВИЙ - ФОП Петренко Петро Петрович" → "ПЕТРЕНКО\s+ПЕТРО\s+ПЕТРОВИЧ".
 * Returns null when there are fewer than two identifying tokens (too weak).
 */
export const buildCounterpartyNameRegexSource = (
  name: string | undefined | null
): string | null => {
  const tokens = normalizeCounterpartyName(name).split(' ').filter(Boolean)
  if (tokens.length < 2) return null
  return tokens
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s+')
}

/**
 * A self-transaction is money the domain owner moves to/from themselves
 * (returns, own card top-ups, own transfers). The counterparty tax code then
 * equals the owner's own code (AUT_CNTR_CRF === AUT_MY_CRF), so it must never
 * be used to auto-select the owner's own company onto such a row.
 */
export const isSelfTransaction = (
  transaction:
    | Pick<ITransaction, 'AUT_CNTR_CRF' | 'AUT_MY_CRF'>
    | null
    | undefined
): boolean => {
  const counterparty = transaction?.AUT_CNTR_CRF?.trim()
  const owner = transaction?.AUT_MY_CRF?.trim()
  return Boolean(counterparty && owner && counterparty === owner)
}

type MatchResult = { companyId: string | null; matchedBy: MatchType | null }

export const matchByAccount = (
  transaction: ITransaction,
  companies: IRealestate[]
): MatchResult | null => {
  if (transaction.AUT_CNTR_NAM?.includes('Транз')) return null
  const company = companies.find(
    (c) => c.account && c.account === transaction.AUT_CNTR_ACC
  )
  return company?._id
    ? { companyId: company._id, matchedBy: MatchType.ACCOUNT }
    : null
}

export const matchByRnokpp = (
  transaction: ITransaction,
  companies: IRealestate[]
): MatchResult | null => {
  const codes: string[] = []
  // Transit accounts carry the ultimate recipient's tax code here.
  if (transaction.RECIPIENT_ULTMT_NCEO) {
    codes.push(transaction.RECIPIENT_ULTMT_NCEO)
  }
  // Direct (non-transit) payments carry the counterparty's tax code in
  // AUT_CNTR_CRF. It's account-independent, so it matches the same payer even
  // when they pay from a different bank account. Transit rows put the
  // transit/bank code here (handled via NCEO above), and self-transactions
  // carry the owner's own code — skip both.
  const cntrCrf = transaction.AUT_CNTR_CRF?.trim()
  if (
    cntrCrf &&
    !transaction.AUT_CNTR_NAM?.includes('Транз') &&
    !isSelfTransaction(transaction)
  ) {
    codes.push(cntrCrf)
  }
  if (codes.length === 0) return null
  const company = companies.find((c) =>
    codes.some(
      (code) => (c.rnokpp && c.rnokpp === code) || c.description?.includes(code)
    )
  )
  return company?._id
    ? { companyId: company._id, matchedBy: MatchType.RNOKPP }
    : null
}

/**
 * Last-resort match: the same payer keeps changing bank accounts and has no tax
 * code stored on the company, but the counterparty name is stable. Requires a
 * FULL normalized-name equality (≥2 tokens) to avoid loose false positives, and
 * never fires for transit or self-transactions.
 */
export const matchByName = (
  transaction: ITransaction,
  companies: IRealestate[]
): MatchResult | null => {
  if (transaction.AUT_CNTR_NAM?.includes('Транз')) return null
  if (isSelfTransaction(transaction)) return null
  const target = normalizeCounterpartyName(transaction.AUT_CNTR_NAM)
  if (target.split(' ').filter(Boolean).length < 2) return null
  const company = companies.find(
    (c) => normalizeCounterpartyName(c.companyName) === target
  )
  return company?._id
    ? { companyId: company._id, matchedBy: MatchType.NAME }
    : null
}

export const matchByPrevious = (
  transaction: ITransaction
): MatchResult | null => {
  if (!transaction.previousCompanyId) return null
  return {
    companyId: String(transaction.previousCompanyId),
    matchedBy: MatchType.PREVIOUS,
  }
}

export const matchCompany = (
  transaction: ITransaction,
  companies: IRealestate[] = []
): MatchResult => {
  return (
    matchByAccount(transaction, companies) ??
    matchByRnokpp(transaction, companies) ??
    matchByPrevious(transaction) ??
    matchByName(transaction, companies) ?? { companyId: null, matchedBy: null }
  )
}

export const getResolvedDescription = (
  transaction: ITransaction,
  companies: IRealestate[]
): string => {
  const match = matchCompany(transaction, companies)

  if (match.matchedBy === MatchType.ACCOUNT) {
    return transaction.AUT_CNTR_ACC || transaction.OSND || ''
  }

  return transaction.OSND || ''
}
