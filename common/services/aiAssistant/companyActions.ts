import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import { getDomainServiceCatalog } from '@common/services/customServiceService/customService.service'
import {
  matchTariff,
  resolveStreet,
  type ServicePriceInput,
} from '@common/services/aiAssistant/serviceActions'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { escapeRegexForMongo } from '@utils/escape-regex/escape-regex'
import { normalizeCurrency, toRoundFixed } from '@utils/helpers'

/**
 * Builds the draft behind the `previewCompany` tool: a new company
 * (RealEstate) for RealEstateModal to open prefilled. Nothing is written - the
 * user checks the form and saves it through the same API as by hand.
 */

export interface BuildCompanyDraftParams {
  domainId: string
  companyName: string
  /** Address in the user's words; must be one of the domain's addresses. */
  street?: string
  /** Contract details, director, etc. - required by the form. */
  description?: string
  adminEmails?: string[]
  totalArea?: number
  pricePerMeter?: number
  currency?: string
  contractNumber?: string
  /** `YYYY-MM-DD`. */
  contractDate?: string
  /** The company's own prices for the domain's services, in the user's words. */
  prices?: ServicePriceInput[]
  ctx: UserContext
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

const positive = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Number(toRoundFixed(value))
    : undefined

export async function buildCompanyDraft({
  domainId,
  companyName,
  street: saidStreet,
  description,
  adminEmails = [],
  totalArea,
  pricePerMeter,
  currency,
  contractNumber,
  contractDate,
  prices = [],
  ctx,
}: BuildCompanyDraftParams) {
  const name = companyName?.trim()
  if (!name) throw new Error('companyName is required')

  // Only a domain the user administers - the same rule the real-estate API
  // applies when the form is saved.
  const domain = await Domain.findOne({
    _id: domainId,
    ...(ctx.isGlobalAdmin ? {} : { adminEmails: ctx.user.email }),
  })
    .select('name')
    .lean()
  if (!domain) throw new Error('domain not accessible')

  const street = await resolveStreet(domainId, saidStreet)

  const catalog = ((await getDomainServiceCatalog(domainId)) ?? [])
    .flatMap((group) => group.services)
    .map((service: any) => ({
      _id: String(service._id),
      fieldName: String(service.fieldName ?? ''),
      name: String(service.name ?? service.fieldName ?? ''),
    }))
    .filter(({ fieldName }) => fieldName)

  const unmatched: string[] = []
  const customServices: {
    _id: string
    fieldName: string
    label: string
    price: number
  }[] = []
  for (const { name: said, price } of prices) {
    const entry = matchTariff(said, catalog)
    const value = positive(Number(price))
    const service =
      entry && catalog.find((c) => c.fieldName === entry.fieldName)
    if (!service || value === undefined) {
      unmatched.push(said)
      continue
    }
    customServices.push({
      _id: service._id,
      fieldName: service.fieldName,
      label: service.name,
      price: value,
    })
  }

  const emails = adminEmails.map((email) => email.trim().toLowerCase())
  const invalidEmails = emails.filter((email) => !EMAIL.test(email))

  // A second company under the same name is usually a mistake worth a word.
  const similar = await RealEstate.find({
    domain: domainId,
    companyName: { $regex: escapeRegexForMongo(name), $options: 'i' },
  })
    .select('companyName')
    .limit(5)
    .lean()

  return {
    draft: {
      domain: domainId,
      ...(street ? { street: street._id } : {}),
      companyName: name,
      description: description?.trim() ?? '',
      adminEmails: emails.filter((email) => EMAIL.test(email)),
      ...(positive(totalArea) !== undefined
        ? { totalArea: positive(totalArea) }
        : {}),
      ...(positive(pricePerMeter) !== undefined
        ? { pricePerMeter: positive(pricePerMeter) }
        : {}),
      currency: normalizeCurrency(currency),
      ...(contractNumber?.trim()
        ? { contractNumber: contractNumber.trim() }
        : {}),
      ...(contractDate && ISO_DAY.test(contractDate) ? { contractDate } : {}),
      customServices,
    },
    domainName: domain.name,
    streetAddress: street?.address ?? null,
    unmatched,
    invalidEmails,
    similar: similar.map(({ companyName }) => companyName),
  }
}
