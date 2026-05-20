import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { ITransaction } from './transactionTypes'
import {
  buildFinalTechnicalTransactionId,
  getResolvedDescription,
  normalizeTechnicalTransactionId,
} from './bankHelper'

export interface TransactionPayload {
  AUT_CNTR_ACC: string
  AUT_CNTR_NAM: string
  AUT_CNTR_MFO: string
  OSND: string
  Description: string
  TECHNICAL_TRANSACTION_ID: string
}

export function getStreetId(
  company: IRealestate | undefined
): string | undefined {
  if (!company) return undefined
  return typeof company.street === 'object'
    ? company.street._id
    : company.street
}

export function buildTransactionPayload(
  transaction: ITransaction,
  companies: IRealestate[]
): TransactionPayload {
  return {
    AUT_CNTR_ACC: transaction.AUT_CNTR_ACC,
    AUT_CNTR_NAM: transaction.AUT_CNTR_NAM,
    AUT_CNTR_MFO: transaction.AUT_CNTR_MFO,
    OSND: transaction.OSND,
    Description: getResolvedDescription(transaction, companies),
    TECHNICAL_TRANSACTION_ID:
      buildFinalTechnicalTransactionId(transaction) ||
      normalizeTechnicalTransactionId(transaction.TECHNICAL_TRANSACTION_ID),
  }
}
