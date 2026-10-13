import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import Street from '@modules/models/Street'
import {
  buildInvoiceDraft,
  companyOwnershipFilter,
  findMonthService,
  toCustomInvoiceLine,
  type ExtraLine,
} from '@common/services/aiAssistant/invoiceActions'
import { normalize } from '@common/services/aiAssistant/serviceActions'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { escapeRegexForMongo } from '@utils/escape-regex/escape-regex'
import { normalizeCurrency, plusFloat } from '@utils/helpers'
import { makeNewEntityValue } from '@utils/inlineCreate'

/**
 * The `previewInvoice` draft when the user names the sides of the invoice
 * instead of picking them: "рахунок від Олега для Гугл про, 168 год по 6$".
 *
 * Each side the user named is looked up among their own records first. One
 * that does not exist yet goes into the draft as a `new::<name>` value - the
 * same thing the form holds when a name is typed by hand - and AddPaymentModal
 * creates it on save, before the invoice. Nothing is written here.
 *
 * An existing company is billed the usual way (`buildInvoiceDraft`: tariffs
 * plus the named lines); a new one only by the named lines.
 */

export interface BuildPartiesInvoiceDraftParams {
  companyId?: string
  companyName?: string
  /** Required by the form for a new company; ignored for an existing one. */
  companyEmail?: string
  domainId?: string
  domainName?: string
  /** For a new company: an address of its provider, or a new one with `city`. */
  street?: string
  city?: string
  month: number
  year: number
  currency?: string
  lines?: ExtraLine[]
  /** For an existing company: bill only the named lines. */
  onlyNamedLines?: boolean
  ctx: UserContext
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const exactName = (name: string) => ({
  $regex: `^${escapeRegexForMongo(name.trim())}$`,
  $options: 'i',
})

const ownDomainFilter = (ctx: UserContext) =>
  ctx.isGlobalAdmin ? {} : { adminEmails: ctx.user.email }

async function resolveDomain(
  { domainId, domainName }: BuildPartiesInvoiceDraftParams,
  ctx: UserContext
) {
  if (domainId) {
    const domain = await Domain.findOne({
      _id: domainId,
      ...ownDomainFilter(ctx),
    })
      .select('name defaultTemplate streets')
      .lean()
    if (!domain) throw new Error('domain not accessible')
    return domain
  }
  if (!domainName?.trim()) return null

  const matches = await Domain.find({
    ...ownDomainFilter(ctx),
    archived: { $ne: true },
    name: exactName(domainName),
  })
    .select('name defaultTemplate streets')
    .limit(2)
    .lean()
  if (matches.length > 1) {
    throw new Error(`several providers are named «${domainName.trim()}»`)
  }
  return matches[0] ?? null
}

async function findOwnCompanies(
  name: string,
  domainId: string | undefined,
  ctx: UserContext
) {
  return RealEstate.find({
    $and: [
      await companyOwnershipFilter(ctx),
      {
        companyName: exactName(name),
        ...(domainId ? { domain: domainId } : {}),
      },
    ],
  })
    .select('companyName domain')
    .populate('domain', 'name')
    .limit(5)
    .lean()
}

/** An address of the provider by words, or null. */
async function findStreet(streetIds: unknown[], said: string) {
  const key = normalize(said)
  const streets = await Street.find({ _id: { $in: streetIds } })
    .select('address city')
    .lean()
  return (
    streets.find((street) => {
      const address = normalize(street.address)
      return address.includes(key) || key.includes(address)
    }) ?? null
  )
}

export async function buildPartiesInvoiceDraft(
  params: BuildPartiesInvoiceDraftParams
) {
  const { companyId, companyName, month, year, currency, ctx } = params
  const lines = (params.lines ?? []).map(toCustomInvoiceLine).filter(Boolean)

  let domain = await resolveDomain(params, ctx)
  const newDomainName =
    !domain && params.domainName?.trim() ? params.domainName.trim() : null

  // An existing company: by id, or by its exact name within the provider.
  let existingCompanyId: string | null = null
  if (companyId) {
    existingCompanyId = companyId
  } else if (companyName?.trim() && !newDomainName) {
    const found = await findOwnCompanies(
      companyName,
      domain?._id?.toString(),
      ctx
    )
    if (found.length > 1) {
      const where = found.map((c) => (c.domain as any)?.name).join(', ')
      throw new Error(
        `several companies are named «${companyName.trim()}» (providers: ${where}); ask which one`
      )
    }
    existingCompanyId = found[0]?._id?.toString() ?? null
  } else if (!companyName?.trim()) {
    throw new Error('company is required: its name or id')
  }

  if (existingCompanyId) {
    const draft = await buildInvoiceDraft({
      companyId: existingCompanyId,
      month,
      year,
      extraLines: params.lines,
      onlyNamedLines: params.onlyNamedLines,
      ctx,
    })
    if (domain && draft.domain !== domain._id.toString()) {
      throw new Error('this company belongs to another provider')
    }
    return {
      draft: currency
        ? { ...draft, currency: normalizeCurrency(currency) }
        : draft,
      created: { domain: null, company: null, street: null },
      invalidEmail: false,
    }
  }

  // A new company needs a provider: the named one, a new one, or the user's
  // only one.
  if (!domain && !newDomainName) {
    const own = await Domain.find({
      ...ownDomainFilter(ctx),
      archived: { $ne: true },
    })
      .select('name defaultTemplate streets')
      .limit(2)
      .lean()
    if (own.length !== 1) {
      throw new Error('provider is required for a new company: ask its name')
    }
    domain = own[0]
  }

  let street: string | undefined
  let newStreetLabel: string | null = null
  if (params.street?.trim()) {
    const known = domain
      ? await findStreet(domain.streets ?? [], params.street)
      : null
    if (known) {
      street = known._id.toString()
    } else {
      if (!params.city?.trim()) {
        throw new Error('city is required for a new address: ask it')
      }
      // The form's format for an address created on save.
      street = makeNewEntityValue(
        `${params.street.trim()}::${params.city.trim()}`
      )
      newStreetLabel = `${params.street.trim()} (м. ${params.city.trim()})`
    }
  }

  const domainId = domain?._id?.toString()
  const existingStreet = street && !newStreetLabel ? street : undefined
  const service = domainId
    ? await findMonthService(domainId, existingStreet, year, month, ctx)
    : null

  const email = params.companyEmail?.trim().toLowerCase()
  const validEmail = email && EMAIL.test(email) ? email : undefined
  const name = companyName.trim()

  return {
    draft: {
      type: 'debit',
      domain: domainId ?? makeNewEntityValue(newDomainName),
      // «Напрямок послуг» of a new provider: none, the lines are its own.
      ...(domainId ? {} : { newDomainTemplateId: '' }),
      ...(street ? { street } : {}),
      company: makeNewEntityValue(name),
      ...(validEmail ? { companyEmail: validEmail } : {}),
      monthService: service ? service._id.toString() : null,
      period: { year, month },
      invoiceCreationDate: new Date(),
      description: '',
      generalSum: lines.reduce((total, line) => plusFloat(total, line.sum), 0),
      currency: normalizeCurrency(currency),
      // Saved into the provider's catalog too, so next month they can be
      // picked instead of typed.
      invoice: lines.map((line) => ({ ...line, saveToDomain: true })),
      extraLines: lines.map((line) => ({ ...line, saveToDomain: true })),
      template: (domain as any)?.defaultTemplate || 'classic',
      invoiceLang: 'uk' as const,
    },
    created: {
      domain: newDomainName,
      company: name,
      street: newStreetLabel,
    },
    invalidEmail: !!email && !validEmail,
  }
}
