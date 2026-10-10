import IBAN from 'iban'
import Domain from '@modules/models/Domain'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { escapeRegexForMongo } from '@utils/escape-regex/escape-regex'

/**
 * Builds the draft behind the `previewDomain` tool: a new service provider
 * (Domain) for DomainModal to open prefilled. Nothing is written - the user
 * checks the form and saves it through the same API as by hand.
 *
 * Only the requisites are drafted. Bank tokens are secrets and never go
 * through the assistant; addresses and the services template are set in the
 * form (or added later with previewStreet).
 */

export interface BuildDomainDraftParams {
  name: string
  adminEmails?: string[]
  iban?: string
  /** РНОКПП (10 digits) or ЄДРПОУ (8 digits). */
  rnokpp?: string
  mfo?: string
  /** Anything else for the invoice footer: address, phone, director. */
  description?: string
  ctx: UserContext
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TAX_ID = /^(\d{8}|\d{10})$/
const MFO = /^\d{6}$/

const digits = (value?: string) => (value ?? '').replace(/\s/g, '')

export async function buildDomainDraft({
  name: saidName,
  adminEmails = [],
  iban: saidIban,
  rnokpp: saidRnokpp,
  mfo: saidMfo,
  description,
  ctx,
}: BuildDomainDraftParams) {
  const name = saidName?.trim()
  if (!name) throw new Error('name is required')

  const invalid: string[] = []

  let iban: string | undefined
  if (saidIban?.trim()) {
    const electronic = IBAN.electronicFormat(saidIban)
    if (IBAN.isValid(electronic)) iban = electronic
    else invalid.push('iban')
  }

  let rnokpp: string | undefined
  if (saidRnokpp?.trim()) {
    if (TAX_ID.test(digits(saidRnokpp))) rnokpp = digits(saidRnokpp)
    else invalid.push('rnokpp')
  }

  // A Ukrainian IBAN carries the bank's МФО in characters 5-10.
  let mfo: string | undefined
  if (saidMfo?.trim()) {
    if (MFO.test(digits(saidMfo))) mfo = digits(saidMfo)
    else invalid.push('mfo')
  } else if (iban?.startsWith('UA')) {
    mfo = iban.slice(4, 10)
  }

  const emails = adminEmails.map((email) => email.trim().toLowerCase())
  const invalidEmails = emails.filter((email) => !EMAIL.test(email))
  // The form adds the current user too, and the API insists on it. Kept as
  // the session has it: access is checked by exact match on adminEmails.
  const ownEmail = ctx.user.email
  const validEmails = [
    ...(ownEmail ? [ownEmail] : []),
    ...new Set(
      emails.filter(
        (email) => EMAIL.test(email) && email !== ownEmail?.toLowerCase()
      )
    ),
  ]

  // The requisites lines the form keeps in the description, above the rest.
  const descriptionLines = [
    ...(iban ? [`IBAN: ${iban}`] : []),
    ...(rnokpp ? [`РНОКПП: ${rnokpp}`] : []),
    ...(mfo ? [`МФО: ${mfo}`] : []),
    ...(description?.trim() ? [description.trim()] : []),
  ]

  // A second provider under the same name is usually a mistake worth a word.
  const similar = await Domain.find({
    ...(ctx.isGlobalAdmin ? {} : { adminEmails: ctx.user.email }),
    name: { $regex: escapeRegexForMongo(name), $options: 'i' },
  })
    .select('name')
    .limit(5)
    .lean()

  return {
    draft: {
      name,
      adminEmails: validEmails,
      ...(iban ? { iban } : {}),
      ...(rnokpp ? { rnokpp } : {}),
      ...(mfo ? { mfo } : {}),
      description: descriptionLines.join('\n'),
    },
    invalid,
    invalidEmails,
    similar: similar.map((domain) => domain.name),
  }
}
