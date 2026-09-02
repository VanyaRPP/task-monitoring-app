/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next'
import start, { Data } from '@pages/api/api.config'
import { getTransactionsForDateInterval } from './utils/getTransactions/index'
import Payment from '@modules/models/Payment'
import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import { getCurrentUser } from '@utils/getCurrentUser'
import {
  buildCounterpartyNameRegexSource,
  buildFinalTechnicalTransactionId,
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
      const allPayments = await Payment.find({
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
      const payment = await Payment.findOne({
        'transaction.OSND': transaction.OSND,
      })
        .sort({ invoiceCreationDate: -1 })
        .lean()

      if (payment?.company) {
        return {
          isMatchingPayment: false,
          previousCompanyId: String(payment.company),
        }
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  await start()

  const { isGlobalAdmin, isDomainAdmin, user } = await getCurrentUser(req, res)

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    })
  }

  if (!isGlobalAdmin && !isDomainAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden',
    })
  }
  const {
    token: tokenQuery,
    startDate,
    limit,
    followId,
    acc,
    domainId,
  } = req.query

  const { token: tokenHeader } = req.headers

  if (!tokenQuery && !tokenHeader) {
    return res
      .status(404)
      .json({ success: false, message: 'Error! No bank token!' })
  }

  const domainIdStr =
    typeof domainId === 'string' && domainId.length > 0 ? domainId : null

  if (domainIdStr && isDomainAdmin && !isGlobalAdmin) {
    const allowed = await Domain.findOne({
      _id: domainIdStr,
      adminEmails: user.email,
    })
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: domain',
      })
    }
  }

  switch (req.method) {
    case 'GET':
      try {
        const transactions = await getTransactionsForDateInterval(
          tokenHeader ?? tokenQuery,
          acc,
          startDate,
          limit,
          followId
        )

        const resolvedDomainId =
          domainIdStr && (isGlobalAdmin || isDomainAdmin) ? domainIdStr : null

        // Fetch the domain's companies once, then reuse for every transaction's
        // on-air identity match (avoids a DB query per transaction).
        const companies = resolvedDomainId
          ? await RealEstate.find({ domain: resolvedDomainId })
              .select('_id companyName account rnokpp description')
              .lean()
          : []

        const checkedTransactions = await Promise.all(
          transactions.map(async (transaction) => {
            try {
              const matchResult = await checkTransaction({
                transaction,
                domainId: resolvedDomainId,
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

        return res
          .status(200)
          .json({ success: true, data: checkedTransactions })
      } catch (error) {
        return res.status(400).json({ success: false, message: error.message })
      }

    case 'POST':
      return res
        .status(501)
        .json({ success: false, message: 'not implemented' })

    case 'PATCH':
      return res
        .status(501)
        .json({ success: false, message: 'not implemented' })

    case 'DELETE':
      return res
        .status(501)
        .json({ success: false, message: 'not implemented' })
  }
}
