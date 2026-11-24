import CustomService from '@modules/models/CustomService'
import Domain from '@modules/models/Domain'
import DomainTypeTemplate from '@modules/models/domain-type-template'
import { BUILT_IN_SERVICE_ID_TO_TYPE, ServiceType } from '@utils/constants'
import { resolveServiceType } from '@utils/domain/resolve-service-type'

export const HOUSING_FEE_GROUP_NAME = 'Квартплата'
// Same name as the global catalog service (scripts/seed-housing-fee-service.ts)
// that clone-for-domain copies into a domain.
export const HOUSING_FEE_SERVICE_NAME = 'Квартплата з нарахуванням боргу'

const isHousingFee = (service: {
  _id?: unknown
  serviceType?: string | null
  fieldName?: string | null
}) =>
  resolveServiceType(service as Parameters<typeof resolveServiceType>[0]) ===
  ServiceType.HousingFee

/**
 * A domain of the «Нерухомість» category must carry the housing-fee service:
 * its presence opens the debt calculation page for the domain.
 *
 * The category is the template's - the domain stores only
 * `domainTypeTemplateId`; the category picker in the domain form is a filter.
 * A domain that already has the service in its catalog (own copy or the
 * built-in one) is left alone.
 *
 * Returns `true` when the service was attached to the domain.
 */
export async function ensureHousingFeeService(
  domainId: string
): Promise<boolean> {
  const domain = await Domain.findById(domainId)
    .select('customServices domainTypeTemplateId')
    .lean()
  if (!domain?.domainTypeTemplateId) return false

  const template = await DomainTypeTemplate.findById(
    domain.domainTypeTemplateId
  )
    .select('category')
    .lean()
  if (template?.category !== 'real-estate') return false

  const catalogIds = (domain.customServices ?? []).flatMap(
    ({ services }) => services ?? []
  )
  if (
    catalogIds.some(
      (id) => BUILT_IN_SERVICE_ID_TO_TYPE[id] === ServiceType.HousingFee
    )
  ) {
    return false
  }
  const catalog = catalogIds.length
    ? await CustomService.find({ _id: { $in: catalogIds } })
        .select('serviceType fieldName')
        .lean()
    : []
  if (catalog.some(isHousingFee)) return false

  // An own copy may exist without being in the catalog: reuse, don't duplicate.
  const service =
    (await CustomService.findOne({
      domain: domainId,
      serviceType: ServiceType.HousingFee,
    })) ??
    (await CustomService.create({
      name: HOUSING_FEE_SERVICE_NAME,
      fieldName: ServiceType.HousingFee,
      serviceType: ServiceType.HousingFee,
      domain: domainId,
    }))
  const serviceId = String(service._id)

  const attached = await Domain.updateOne(
    { _id: domainId, 'customServices.groupName': HOUSING_FEE_GROUP_NAME },
    { $addToSet: { 'customServices.$.services': serviceId } }
  )
  if (!attached.matchedCount) {
    await Domain.updateOne(
      { _id: domainId },
      {
        $push: {
          customServices: {
            groupName: HOUSING_FEE_GROUP_NAME,
            services: [serviceId],
          },
        },
      }
    )
  }

  return true
}

/** For save handlers: the domain is already saved, so a failure here is logged, not returned. */
export async function ensureHousingFeeSafely(
  domainId: string
): Promise<boolean> {
  try {
    return await ensureHousingFeeService(domainId)
  } catch (error) {
    console.error('[housing-fee] ensure_failed', {
      domainId: String(domainId),
      message: (error as Error)?.message,
    })
    return false
  }
}
