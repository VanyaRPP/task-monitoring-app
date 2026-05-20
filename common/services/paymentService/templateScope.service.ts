import RealEstate from '@common/modules/models/RealEstate'
import Domain from '@modules/models/Domain'
import type {
  TemplateScope,
  TemplateScopeTarget,
} from '@common/api/paymentApi/payment.api.types'

export interface TemplateScopePerms {
  isGlobalAdmin: boolean
  isDomainAdmin: boolean
  user: { email: string }
}

export interface ApplyTemplateScopeArgs {
  scope: TemplateScope | undefined
  templateKey: string | undefined
  companyId?: string
  domainId?: string
  perms: TemplateScopePerms
}

export type ApplyTemplateScopeResult =
  | { kind: 'ok'; applied: boolean }
  | { kind: 'forbidden'; message: string }

const isPersistentScope = (
  scope: TemplateScope | undefined
): scope is TemplateScopeTarget => scope === 'company' || scope === 'domain'

export async function applyTemplateScope({
  scope,
  templateKey,
  companyId,
  domainId,
  perms,
}: ApplyTemplateScopeArgs): Promise<ApplyTemplateScopeResult> {
  if (!isPersistentScope(scope) || !templateKey) {
    return { kind: 'ok', applied: false }
  }

  if (scope === 'company') {
    if (!perms.isGlobalAdmin) {
      return { kind: 'forbidden', message: 'not allowed' }
    }
    if (!companyId) {
      return { kind: 'forbidden', message: 'company id required' }
    }
    await RealEstate.findByIdAndUpdate(companyId, {
      $set: { defaultTemplate: templateKey },
    })
    return { kind: 'ok', applied: true }
  }

  if (!domainId) {
    return { kind: 'forbidden', message: 'domain id required' }
  }
  let hasAccess = perms.isGlobalAdmin
  if (!hasAccess && perms.isDomainAdmin) {
    const domain = await Domain.findOne({
      _id: domainId,
      adminEmails: { $in: [perms.user.email] },
    })
    hasAccess = !!domain
  }
  if (!hasAccess) {
    return { kind: 'forbidden', message: 'not allowed' }
  }
  await Domain.findByIdAndUpdate(domainId, {
    $set: { defaultTemplate: templateKey },
  })
  return { kind: 'ok', applied: true }
}
