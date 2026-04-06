import { IRealestate } from "@common/api/realestateApi/realestate.api.types";
import { ITransaction } from "./transactionTypes";

export enum MatchType {
  ACCOUNT = 'account',
  PREVIOUS = 'previous',
}

export const matchCompany = (
  transaction: ITransaction,
  companies: IRealestate[] = []
): { companyId: string | null; matchedBy: MatchType | null } => {
  const isTransit = transaction.AUT_CNTR_NAM?.includes('Транз')

  if (!isTransit) {
    const byAccount = companies.find(
      (c) => c.account && c.account === transaction.AUT_CNTR_ACC
    )

    if (byAccount) {
      return { companyId: byAccount._id!, matchedBy: MatchType.ACCOUNT }
    }
  }

  if (transaction.previousCompanyId) {
    return {
      companyId: String(transaction.previousCompanyId),
      matchedBy: MatchType.PREVIOUS,
    }
  }

  return { companyId: null, matchedBy: null }
}

export const getResolvedDescription = (
  transaction: ITransaction,
  companies: IRealestate[]
): string => {
  const match = matchCompany(transaction, companies);

  // Если данные по полю AUT_CNTR_ACC совпали (MatchType.ACCOUNT)
  if (match.matchedBy === MatchType.ACCOUNT) {
    return transaction.AUT_CNTR_ACC || transaction.OSND || '';
  }

  // Во всех остальных случаях оставляем оригинальное назначение платежа
  return transaction.OSND || '';
}