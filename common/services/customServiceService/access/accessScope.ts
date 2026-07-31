import mongoose from 'mongoose'

/**
 * The single source of truth for "which custom services is this caller allowed
 * to see". Resolved once per request from the user's role + owned domains
 * (see resolveAccessScope) and then handed to buildServiceFilter, which is
 * guaranteed to never produce a Mongo filter wider than this scope.
 *
 * - `all`     → GlobalAdmin: no domain restriction (legacy global pool).
 * - `domains` → DomainAdmin: exactly the domains they administer. `domainIds`
 *   are their domains; `referencedServiceIds` are the shared/seeded catalog
 *   entries (e.g. utility services with no `domain` ref) that those domains
 *   pull in via their groups — needed so aggregate pages still resolve them.
 * - `none`    → User (or anyone with no admin role): forbidden.
 */
export type AccessScope =
  | { kind: 'all' }
  | { kind: 'domains'; domainIds: string[]; referencedServiceIds: string[] }
  | { kind: 'none' }

export interface ServiceFilterRequest {
  /** A validated ObjectId string, or null when the caller did not send one. */
  domainId: string | null
  /**
   * Validated ObjectId strings, or null when the caller did not send `ids` at
   * all. An empty array means "explicitly asked for nothing" → empty result.
   */
  ids: string[] | null
  /**
   * Resolved default service ids for a template category, or null when no
   * category was requested. An empty array means "category requested but it has
   * no built-in defaults" (still distinct from null).
   */
  categoryDefaultIds: string[] | null
}

export type BuildServiceFilterFailure = {
  ok: false
  code: 'forbidden' | 'empty'
}

export type BuildServiceFilterResult =
  | { ok: true; filter: Record<string, unknown> }
  | BuildServiceFilterFailure

/** Type guard so callers narrow reliably regardless of tsconfig strictness. */
export function isFilterFailure(
  r: BuildServiceFilterResult
): r is BuildServiceFilterFailure {
  return !r.ok
}

function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id)
}

type DomainClauseResult =
  | { ok: true; clause: Record<string, unknown> }
  | { ok: false; code: 'forbidden' }

/**
 * Builds the "which documents may this caller see" portion of the filter from
 * the access scope and the requested domain. This is where the security
 * invariant lives: a DomainAdmin can never widen past their own domains.
 */
function buildDomainClause(
  scope: Extract<AccessScope, { kind: 'all' | 'domains' }>,
  req: ServiceFilterRequest
): DomainClauseResult {
  const { domainId, categoryDefaultIds } = req
  const defaultsClause =
    categoryDefaultIds && categoryDefaultIds.length
      ? [{ _id: { $in: categoryDefaultIds.map(toObjectId) } }]
      : []

  if (scope.kind === 'all') {
    // No domain requested → the whole catalog (legacy global behaviour).
    if (!domainId) return { ok: true, clause: {} }

    const domainObjectId = toObjectId(domainId)
    if (categoryDefaultIds !== null) {
      return {
        ok: true,
        clause: { $or: [{ domain: domainObjectId }, ...defaultsClause] },
      }
    }
    // Legacy union: this domain + all domain-less (legacy) services.
    return {
      ok: true,
      clause: {
        $or: [
          { domain: domainObjectId },
          { domain: { $in: [null, undefined] } },
          { domain: { $exists: false } },
        ],
      },
    }
  }

  // scope.kind === 'domains' (DomainAdmin)
  if (domainId) {
    // A specific domain was requested — it MUST be one they administer.
    if (!scope.domainIds.includes(domainId)) {
      return { ok: false, code: 'forbidden' }
    }
    const domainObjectId = toObjectId(domainId)
    if (categoryDefaultIds !== null) {
      // Own domain + the category's shared defaults (intended to be pickable).
      return {
        ok: true,
        clause: { $or: [{ domain: domainObjectId }, ...defaultsClause] },
      }
    }
    // Only this domain — never the legacy global pool.
    return { ok: true, clause: { domain: domainObjectId } }
  }

  // Auto-scope: no domain requested → the union of ALL their domains plus the
  // shared/seeded services those domains reference. This is what lets aggregate
  // pages (Services, admin catalog) call with no domainId and still get exactly
  // — and only — the caller's services, with no 403 and no leak.
  const orClauses: Record<string, unknown>[] = [
    { domain: { $in: scope.domainIds.map(toObjectId) } },
  ]
  const refIds = Array.from(
    new Set([...scope.referencedServiceIds, ...(categoryDefaultIds ?? [])])
  )
  if (refIds.length) {
    orClauses.push({ _id: { $in: refIds.map(toObjectId) } })
  }
  return { ok: true, clause: { $or: orClauses } }
}

/**
 * Pure translation of (access scope + request) into a Mongo filter. Never
 * touches the database. The resulting filter is guaranteed to stay within the
 * caller's access scope, so callers can hand it straight to CustomService.find.
 */
export function buildServiceFilter(
  scope: AccessScope,
  req: ServiceFilterRequest
): BuildServiceFilterResult {
  if (scope.kind === 'none') return { ok: false, code: 'forbidden' }

  // `ids: []` means the caller passed ids but none were valid → nothing to show.
  if (req.ids !== null && req.ids.length === 0) {
    return { ok: false, code: 'empty' }
  }

  const domainClause = buildDomainClause(scope, req)
  if (!domainClause.ok) return { ok: false, code: 'forbidden' }

  // Flat merge (implicit AND across top-level keys) keeps the historical filter
  // shape — `{ $or: [...], _id: { $in } }` — that existing callers/tests rely on.
  const filter: Record<string, unknown> = { ...domainClause.clause }
  if (req.ids !== null) {
    filter._id = { $in: req.ids }
  }

  return { ok: true, filter }
}
