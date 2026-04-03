import { IRealestate } from "@common/api/realestateApi/realestate.api.types";
import { ITransaction } from "./transactionTypes";

export enum MatchType {
  ACCOUNT = 'account',
  PREVIOUS = 'previous',
}

export const matchCompany = (
  transaction: ITransaction,
  companies: IRealestate[]
): { companyId: string | null; matchedBy: MatchType | null } => {
  // 1. account (якщо нормальний)
  const byAccount = companies.find(
    (c) =>
      c.account &&
      c.account === transaction.AUT_CNTR_ACC &&
      !transaction.AUT_CNTR_NAM?.includes('Транз')
  )

  if (byAccount) {
    return { companyId: byAccount._id!, matchedBy: MatchType.ACCOUNT }
  }

  // 2. previousCompanyId (твій best source зараз)
  if (transaction.previousCompanyId) {
    return {
      companyId: String(transaction.previousCompanyId),
      matchedBy: MatchType.PREVIOUS,
    }
  }

  return { companyId: null, matchedBy: null }
}