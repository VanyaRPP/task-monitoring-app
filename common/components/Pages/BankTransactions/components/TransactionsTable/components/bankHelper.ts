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
  return company
    ? { companyId: company._id!, matchedBy: MatchType.ACCOUNT }
    : null
}

export const matchByRnokpp = (
  transaction: ITransaction,
  companies: IRealestate[]
): MatchResult | null => {
  if (!transaction.RECIPIENT_ULTMT_NCEO) return null
  const nceo = transaction.RECIPIENT_ULTMT_NCEO
  const company = companies.find(
    (c) => (c.rnokpp && c.rnokpp === nceo) || c.description?.includes(nceo)
  )
  return company
    ? { companyId: company._id!, matchedBy: MatchType.RNOKPP }
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
    matchByPrevious(transaction) ?? { companyId: null, matchedBy: null }
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
