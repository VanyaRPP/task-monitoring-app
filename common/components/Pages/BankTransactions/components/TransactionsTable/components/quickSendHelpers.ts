import { IRealestate } from '@common/api/realestateApi/realestate.api.types'
import { ITransaction } from './transactionTypes'
import {
  buildFinalTechnicalTransactionId,
  getResolvedDescription,
  isSelfTransaction,
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

export interface CompanyIdentifierPatch {
  _id: string
  account?: string
  rnokpp?: string
}

/**
 * Builds the RealEstate patch that back-fills payer identifiers after the user
 * confirms a company for a transaction, so future payments auto-select it:
 *  - account: stored unless it already matched by account (mirrors old behavior).
 *  - rnokpp (from AUT_CNTR_CRF): stored so the payer matches from ANY account
 *    next time. Never stored for transit/self-transactions, and never overwrites
 *    an rnokpp the company already has.
 * Returns null when there is nothing to persist.
 */
export function buildCompanyIdentifierPatch(
  transaction: ITransaction,
  company: IRealestate | undefined,
  companyId: string,
  { accountAlreadyMatched }: { accountAlreadyMatched: boolean }
): CompanyIdentifierPatch | null {
  if (transaction.AUT_CNTR_NAM?.includes('Транз')) return null

  const patch: CompanyIdentifierPatch = { _id: companyId }

  if (!accountAlreadyMatched && transaction.AUT_CNTR_ACC) {
    patch.account = transaction.AUT_CNTR_ACC
  }

  const counterpartyCrf = transaction.AUT_CNTR_CRF?.trim()
  if (counterpartyCrf && !isSelfTransaction(transaction) && !company?.rnokpp) {
    patch.rnokpp = counterpartyCrf
  }

  if (patch.account === undefined && patch.rnokpp === undefined) return null
  return patch
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
