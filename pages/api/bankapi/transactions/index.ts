/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { withDomainBankToken } from '@common/services/bankTokenService/withDomainBankToken'
import { getTransactionsForDateInterval } from './utils/getTransactions/index'
import Payment from '@modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import { Operations } from '@utils/constants'
import {
  buildCounterpartyNameRegexSource,
  buildFinalTechnicalTransactionId,
  buildTransitPayerOsndRegexSource,
  extractInvoiceNumberFromOsnd,
  extractTransitPayerName,
  isSelfTransaction,
  matchByName,
  matchByRnokpp,
  normalizeTechnicalTransactionId,
  technicalTransactionIdMatchCandidates,
} from '@components/Pages/BankTransactions/components/TransactionsTable/components/bankHelper'

export function normalizeBankAccount(acc: string | undefined | null) {
  if (acc == null || typeof acc !== 'string') return ''
  return acc.trim()
}

/**
 * Resolves a company for a transaction on-air, straight from the domain's
 * company list (RealEstate) — independent of any previously saved payment.
 * This is what lets a brand-new payment (first time from this bank account)
 * auto-select its company by tax code (AUT_CNTR_CRF / NCEO) or by full name.
 * Pure: it receives the already-fetched companies, so it runs no DB query and
 * is trivial to unit test.
 */
export function matchCompanyByIdentity(transaction, companies = []) {
  const match =
    matchByRnokpp(transaction, companies) ?? matchByName(transaction, companies)
  return match?.companyId ? String(match.companyId) : null
}

export async function checkTransaction({
  transaction,
  domainId,
  companies = [],
}) {
  try {
    const candidates = technicalTransactionIdMatchCandidates(transaction)

    if (candidates.length > 0) {
      // A bank transaction is paid into one domain only: a payment saved in
      // another domain neither marks this row as sent nor names its company.
      const allPayments = await Payment.find({
        ...(domainId ? { domain: domainId } : {}),
        'transaction.TECHNICAL_TRANSACTION_ID': { $in: candidates },
      })

      if (allPayments.length > 0) {
        const company = allPayments[0].company
        return {
          isMatchingPayment: true,
          previousCompanyId: company != null ? String(company) : null,
        }
      }
    }

    const isTransit = transaction.AUT_CNTR_NAM?.includes('Транз')

    if (isTransit && transaction.OSND) {
      // The transit account is the bank's and shared by every domain, but the
      // payments we look up are not: a match in another domain would point the
      // row at that domain's company.
      const inDomain = domainId ? { domain: domainId } : {}
      const companyOf = async (filter) => {
        const payment = await Payment.findOne({ ...inDomain, ...filter })
          .sort({ invoiceCreationDate: -1 })
          .lean()
        return payment?.company ? String(payment.company) : null
      }

      // 1. The same purpose was already sent (e.g. a re-payment).
      // 2. The invoice the payer quoted - we issued it, so it names the company
      //    even for the payer's first payment. Only with a domain: invoice
      //    numbers are per domain.
      // 3. An earlier transit payment from the same payer: the purpose changes
      //    with every invoice, the payer's name at its end does not.
      const invoiceNumber = extractInvoiceNumberFromOsnd(transaction.OSND)
      const payerName = extractTransitPayerName(transaction.OSND)
      const previousCompanyId =
        (await companyOf({ 'transaction.OSND': transaction.OSND })) ??
        (domainId && invoiceNumber
          ? await companyOf({ invoiceNumber, type: Operations.Debit })
          : null) ??
        (domainId && payerName
          ? await companyOf({
              'transaction.AUT_CNTR_NAM': { $regex: 'Транз' },
              'transaction.OSND': {
                $regex: buildTransitPayerOsndRegexSource(payerName),
                $options: 'i',
              },
            })
          : null)

      if (previousCompanyId) {
        return { isMatchingPayment: false, previousCompanyId }
      }
    }

    if (!isTransit && !isSelfTransaction(transaction)) {
      const acc = normalizeBankAccount(transaction.AUT_CNTR_ACC)
      // The payer's ЄДРПОУ/name stays the same even when the bank account
      // changes. Past payments store AUT_CNTR_NAM (and AUT_CNTR_CRF going
      // forward), so match on those too — this is what resolves a first payment
      // from a NEW account for a known payer. The tax code is the strongest
      // signal (no full-name collisions), the name is the older-data fallback.
      const nameRegexSource = buildCounterpartyNameRegexSource(
        transaction.AUT_CNTR_NAM
      )
      const cntrCrf = transaction.AUT_CNTR_CRF?.trim()

      if (domainId && (acc || cntrCrf || nameRegexSource)) {
        const or = []
        if (acc) {
          or.push({ 'transaction.AUT_CNTR_ACC': acc })
          if (transaction.AUT_CNTR_ACC !== acc) {
            or.push({ 'transaction.AUT_CNTR_ACC': transaction.AUT_CNTR_ACC })
          }
        }
        if (cntrCrf) {
          or.push({ 'transaction.AUT_CNTR_CRF': cntrCrf })
        }
        if (nameRegexSource) {
          or.push({
            'transaction.AUT_CNTR_NAM': {
              $regex: nameRegexSource,
              $options: 'i',
            },
          })
        }

        const payment = await Payment.findOne({ domain: domainId, $or: or })
          .sort({ invoiceCreationDate: -1 })
          .lean()

        if (payment?.company) {
          return {
            isMatchingPayment: false,
            previousCompanyId: String(payment.company),
          }
        }
      }
    }

    // On-air fallback: resolve the company directly from the domain's company
    // list by tax code / name, so a first-ever payment from a new account still
    // auto-selects its company.
    const identityCompanyId = matchCompanyByIdentity(transaction, companies)
    if (identityCompanyId) {
      return { isMatchingPayment: false, previousCompanyId: identityCompanyId }
    }

    return { isMatchingPayment: false, previousCompanyId: null }
  } catch (error) {
    throw new Error(`${error.message}`)
  }
}

// `?domainId=` picks the domain; its token is decrypted on the server, and the
// wrapper has already checked the caller administers that domain.
export default withDomainBankToken(async (req, res, { token, domainId }) => {
  const { startDate, limit, followId, acc } = req.query

  try {
    const transactions = await getTransactionsForDateInterval(
      token,
      acc,
      startDate,
      limit,
      followId
    )

    // Fetch the domain's companies once, then reuse for every transaction's
    // on-air identity match (avoids a DB query per transaction).
    const companies = await RealEstate.find({ domain: domainId })
      .select('_id companyName account rnokpp description')
      .lean()

    const checkedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        try {
          const matchResult = await checkTransaction({
            transaction,
            domainId,
            companies,
          })
          return { ...transaction, ...matchResult }
        } catch (error) {
          return {
            ...transaction,
            isMatchingPayment: false,
            previousCompanyId: null,
          }
        }
      })
    )

    return res.status(200).json({ success: true, data: checkedTransactions })
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
})
