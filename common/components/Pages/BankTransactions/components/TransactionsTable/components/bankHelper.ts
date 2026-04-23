import { IRealestate } from "@common/api/realestateApi/realestate.api.types";
import { ITransaction } from "./transactionTypes";

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
  return company ? { companyId: company._id!, matchedBy: MatchType.ACCOUNT } : null
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
  return company ? { companyId: company._id!, matchedBy: MatchType.RNOKPP } : null
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
    { companyId: null, matchedBy: null }
  )
}

export const getResolvedDescription = (
  transaction: ITransaction,
  companies: IRealestate[]
): string => {
  const match = matchCompany(transaction, companies);

  if (match.matchedBy === MatchType.ACCOUNT) {
    return transaction.AUT_CNTR_ACC || transaction.OSND || '';
  }

  return transaction.OSND || '';
}