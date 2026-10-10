import Domain from '@modules/models/Domain'
import Street from '@modules/models/Street'
import { normalize } from '@common/services/aiAssistant/serviceActions'
import type { UserContext } from '@common/services/paymentService/payment.service'

/**
 * Builds the draft behind the `previewStreet` tool: a new address for a
 * domain, for AddStreetModal to open prefilled. Nothing is written - the user
 * saves it through the same API as by hand, which links it to the domain.
 */

export interface BuildStreetDraftParams {
  domainId: string
  address: string
  city: string
  ctx: UserContext
}

const sameAddress = (a: string, b: string) => normalize(a) === normalize(b)

export async function buildStreetDraft({
  domainId,
  address,
  city,
  ctx,
}: BuildStreetDraftParams) {
  const cleanAddress = address?.trim()
  const cleanCity = city?.trim()
  if (!cleanAddress) throw new Error('address is required')
  if (!cleanCity) throw new Error('city is required')

  // Only a domain the user administers - the same rule the streets API
  // applies when the address is saved into a domain.
  const domain = await Domain.findOne({
    _id: domainId,
    ...(ctx.isGlobalAdmin ? {} : { adminEmails: ctx.user.email }),
  })
    .select('name streets')
    .lean()
  if (!domain) throw new Error('domain not accessible')

  const own = await Street.find({ _id: { $in: domain.streets ?? [] } })
    .select('address city')
    .lean()
  const existing = own.find(
    (street) =>
      sameAddress(street.address, cleanAddress) &&
      sameAddress(street.city, cleanCity)
  )

  return {
    draft: { domain: domainId, address: cleanAddress, city: cleanCity },
    domainName: domain.name,
    // Already among the domain's addresses: a second copy would split its
    // companies and tariffs between two identical streets.
    existing: existing
      ? { _id: existing._id.toString(), address: existing.address }
      : null,
  }
}
