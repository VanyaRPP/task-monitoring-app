import { useGetCustomServicesQuery } from './customServices.api'
import type { ICustomService } from './customServices.api.types'

/**
 * The scope a page reads the custom-service catalog in.
 * - `accessible` → the whole set the caller is allowed to see. The backend
 *   auto-scopes it (GlobalAdmin: everything; DomainAdmin: the union of their
 *   domains). No domainId is sent — see resolveAccessScope on the server.
 * - `domain` → a single domain the caller administers (e.g. a domain modal).
 */
export type CustomServiceScope =
  | { kind: 'accessible' }
  | { kind: 'domain'; domainId: string | undefined }

/**
 * Single entry point for reading the custom-service catalog. The server is the
 * only authority on visibility (resolveAccessScope), so this hook does NO
 * security filtering — it just forwards the scope's required params and hands
 * back an already-safe list. Presentational filtering (search, a selected-domain
 * dropdown, "only services present in the data") stays in the component.
 *
 * Centralising the request here is the point: when the server contract shifts
 * (as it did in #1714), only this file changes — not every page that reads the
 * catalog.
 */
export function useAccessibleCustomServices(
  scope: CustomServiceScope = { kind: 'accessible' }
) {
  const arg =
    scope.kind === 'domain' && scope.domainId
      ? { domainId: scope.domainId }
      : {}

  const query = useGetCustomServicesQuery(arg)
  const services: ICustomService[] = query.data?.data ?? []

  return { ...query, services }
}
