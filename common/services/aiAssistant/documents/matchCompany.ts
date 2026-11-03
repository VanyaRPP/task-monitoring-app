import RealEstate from '@modules/models/RealEstate'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { companyOwnershipFilter } from '@common/services/aiAssistant/invoiceActions'
import type { ICompanyCandidate, IStatementHeader } from './types'

/** What a statement header offers for telling one company from another. */
export interface IHeaderClues {
  surname?: string
  apartment?: string
  account?: string
  street?: string
}

const MAX_CANDIDATES = 5
const PER_QUERY_LIMIT = 20
const MIN_WORD_LENGTH = 3
const MIN_ACCOUNT_LENGTH = 3

// Apartment and surname each point at the company on their own; the street
// and account only tell apart flats that tie on those.
const APARTMENT_SCORE = 2
const SURNAME_SCORE = 2
const STREET_SCORE = 1
const ACCOUNT_SCORE = 1

/** The text comes off a photo, so it must never reach Mongo as a live regex. */
const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const lettersOnly = (value?: string): string | undefined =>
  value?.replace(/[^\p{L}'’-]/gu, '')

export const headerClues = (header: IStatementHeader): IHeaderClues => {
  const address = header.address ?? ''
  const apartment = (
    /\d+/.exec(header.apartment ?? '')?.[0] ??
    /(?:кв\.?|квартира|№)\s*(\d+)/i.exec(address)?.[1]
  )?.replace(/^0+/, '')
  const street = lettersOnly(
    /(?:вул\.?|вулиця|просп\.?|проспект|пров\.?|провулок|бульв?\.?|бульвар|пл\.?|площа)\s*([\p{L}'’-]+)/iu.exec(
      address
    )?.[1]
  )
  const surname = lettersOnly(header.ownerName?.trim().split(/\s+/)[0])
  const account = header.accountNumber?.replace(/\D/g, '')

  return {
    ...(apartment ? { apartment } : {}),
    ...(street && street.length >= MIN_WORD_LENGTH ? { street } : {}),
    ...(surname && surname.length >= MIN_WORD_LENGTH ? { surname } : {}),
    ...(account && account.length >= MIN_ACCOUNT_LENGTH ? { account } : {}),
  }
}

/**
 * Companies for flats are named like «Квартира №67 Петренко І.І.», so the
 * apartment is matched only right after one of those markers - a bare "67"
 * would also hit a phone number or an area.
 */
const apartmentPattern = (apartment: string): string =>
  `(№|кв\\.?|квартира)\\s*0*${escapeRegex(apartment)}(?!\\d)`

interface ICompanyLike {
  companyName?: string
  description?: string
  street?: { address?: string } | string | null
}

export const scoreCompany = (
  company: ICompanyLike,
  clues: IHeaderClues
): number => {
  const streetAddress =
    typeof company.street === 'object' ? (company.street?.address ?? '') : ''
  const text = `${company.companyName ?? ''} ${company.description ?? ''}`
  const lower = `${text} ${streetAddress}`.toLowerCase()
  let score = 0

  if (
    clues.apartment &&
    new RegExp(apartmentPattern(clues.apartment), 'iu').test(text)
  ) {
    score += APARTMENT_SCORE
  }
  if (clues.surname && lower.includes(clues.surname.toLowerCase())) {
    score += SURNAME_SCORE
  }
  if (clues.street && lower.includes(clues.street.toLowerCase())) {
    score += STREET_SCORE
  }
  if (clues.account && text.includes(clues.account)) {
    score += ACCOUNT_SCORE
  }

  return score
}

export interface ICompanyMatch {
  candidates: ICompanyCandidate[]
  suggestedCompanyId: string | null
}

/**
 * Companies the statement is likely about, among those the user may see.
 *
 * One query per clue, not one `$or`: a limit on the union could cut off the
 * very flat that matches. Only a clear winner is preselected - a tie between
 * two flats is exactly where a guess would put a debt on the wrong person.
 */
export async function findCompanyCandidates(
  header: IStatementHeader,
  ctx: UserContext
): Promise<ICompanyMatch> {
  const clues = headerClues(header)

  const conditions = [
    clues.apartment && {
      companyName: { $regex: apartmentPattern(clues.apartment), $options: 'i' },
    },
    clues.surname && {
      companyName: { $regex: escapeRegex(clues.surname), $options: 'i' },
    },
    clues.account && {
      description: { $regex: escapeRegex(clues.account) },
    },
  ].filter(Boolean)

  if (conditions.length === 0) {
    return { candidates: [], suggestedCompanyId: null }
  }

  const ownership = await companyOwnershipFilter(ctx)
  const batches = await Promise.all(
    conditions.map((condition) =>
      RealEstate.find({
        $and: [ownership, { archived: { $ne: true } }, condition],
      })
        .limit(PER_QUERY_LIMIT)
        .populate('domain', 'name')
        .populate('street', 'address')
        .lean()
    )
  )

  const unique = new Map<string, any>()
  batches.flat().forEach((company: any) => {
    unique.set(String(company._id), company)
  })

  const ranked = [...unique.values()]
    .map((company) => ({ company, score: scoreCompany(company, clues) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES)

  const [top, second] = ranked
  const isClearWinner =
    !!top &&
    top.score >= APARTMENT_SCORE &&
    (!second || second.score < top.score)

  return {
    candidates: ranked.map(({ company }) => ({
      id: String(company._id),
      companyName: company.companyName,
      domainId: String(company.domain?._id ?? company.domain ?? ''),
      domainName: company.domain?.name ?? '',
    })),
    suggestedCompanyId: isClearWinner ? String(top.company._id) : null,
  }
}
