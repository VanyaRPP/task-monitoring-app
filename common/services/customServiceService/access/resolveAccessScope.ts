import Domain from '@modules/models/Domain'
import type { UserContext } from '../customService.service'
import type { AccessScope } from './accessScope'

/**
 * Resolves the caller's {@link AccessScope} — the authoritative answer to "which
 * domains' custom services may this user see". This is the ONE place that reads
 * ownership; every filter is built from its result.
 *
 * DomainAdmin scope mirrors the exact ownership rule already used in
 * getCurrentUser (`Domain.adminEmails` contains the user's email), so a user's
 * catalog access can never drift from the role they were granted.
 */
export async function resolveAccessScope(
  ctx: UserContext
): Promise<AccessScope> {
  if (ctx.isGlobalAdmin) return { kind: 'all' }

  if (ctx.isDomainAdmin) {
    const email = ctx.user?.email
    const domains = await Domain.find({ adminEmails: email })
      .select('_id customServices')
      .lean()

    const domainIds = domains.map((d: any) => String(d._id))

    // Shared/seeded services (no `domain` ref) that these domains reference via
    // their groups — kept so aggregate queries can still resolve them without
    // opening the global pool. Inlined (not importing collectReferencedServiceIds)
    // to avoid a require cycle with customService.service.
    const referencedServiceIds = Array.from(
      new Set(
        domains
          .flatMap((d: any) => d?.customServices ?? [])
          .flatMap((g: any) => g?.services ?? [])
          .map((id: any) => String(id))
          .filter((id: string) => id && id !== 'undefined' && id !== 'null')
      )
    )

    return { kind: 'domains', domainIds, referencedServiceIds }
  }

  return { kind: 'none' }
}
