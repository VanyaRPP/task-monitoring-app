export interface IServiceAliasEntry {
  serviceId: string
  serviceType?: string
  /** Service fieldName/name at save time: matches lines that lack serviceId. */
  fieldName?: string
  serviceName?: string
  alias: string
}

interface DisplayDomain {
  serviceAliases?: IServiceAliasEntry[] | null
  hideQuantityAndPrice?: boolean | null
}

interface InvoiceLineLike {
  serviceId?: unknown
  type?: unknown
  fieldName?: unknown
  name?: string
  [key: string]: unknown
}

export const MAX_SERVICE_ALIAS_LENGTH = 120

export function normalizeAlias(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim() : ''
}

/**
 * Sets (or, for an empty alias, removes) the alias of one service. Returns a
 * new list; keeps one entry per serviceId.
 */
export function upsertServiceAlias(
  current: IServiceAliasEntry[] | null | undefined,
  entry: {
    serviceId: string
    serviceType?: string
    fieldName?: string
    serviceName?: string
    alias: unknown
  }
): IServiceAliasEntry[] {
  const alias = normalizeAlias(entry.alias).slice(0, MAX_SERVICE_ALIAS_LENGTH)
  const rest = (current ?? []).filter((a) => a.serviceId !== entry.serviceId)
  if (!alias) return rest
  return [
    ...rest,
    {
      serviceId: entry.serviceId,
      ...(entry.serviceType ? { serviceType: entry.serviceType } : {}),
      ...(entry.fieldName ? { fieldName: entry.fieldName } : {}),
      ...(entry.serviceName ? { serviceName: entry.serviceName } : {}),
      alias,
    },
  ]
}

/**
 * Alias for an invoice line: matched by serviceId first, then by the line's
 * ServiceType (lines of built-in services such as «Розміщення» may lack
 * serviceId). Resolved at render time so old invoices pick it up too.
 */
export function resolveServiceAlias(
  line: InvoiceLineLike | null | undefined,
  domain: DisplayDomain | null | undefined
): string | undefined {
  const aliases = domain?.serviceAliases
  if (!line || !aliases?.length) return undefined
  const serviceId = line.serviceId != null ? String(line.serviceId) : ''
  const byId = serviceId
    ? aliases.find((a) => a.serviceId === serviceId)
    : undefined
  const byType =
    !byId && line.type
      ? aliases.find((a) => a.serviceType && a.serviceType === line.type)
      : undefined
  const byName =
    !byId && !byType
      ? aliases.find(
          (a) =>
            (a.fieldName && a.fieldName === line.fieldName) ||
            (a.serviceName && a.serviceName === line.name)
        )
      : undefined
  return (byId ?? byType ?? byName)?.alias || undefined
}

/** Replaces `name` with the domain's alias where there is one. */
export function applyServiceAliases<T extends InvoiceLineLike>(
  lines: T[],
  domain: DisplayDomain | null | undefined
): T[] {
  if (!domain?.serviceAliases?.length) return lines
  return lines.map((line) => {
    const alias = resolveServiceAlias(line, domain)
    return alias ? { ...line, name: alias } : line
  })
}

export function shouldHideQuantityAndPrice(
  domain: DisplayDomain | null | undefined
): boolean {
  return domain?.hideQuantityAndPrice === true
}

interface PaymentLike {
  invoice?: InvoiceLineLike[] | null
  [key: string]: unknown
}

/**
 * Stamps a payment with its domain's display settings: `alias` on each line
 * (kept apart from `name`, which catalog grouping still matches on) and the
 * `hideQuantityAndPrice` flag. Returns the input untouched when the domain
 * has nothing to apply.
 */
export function applyDomainDisplay<T extends PaymentLike>(
  payment: T,
  domain: DisplayDomain | null | undefined
): T {
  if (!payment) return payment
  const hide = shouldHideQuantityAndPrice(domain)
  const hasAliases = !!domain?.serviceAliases?.length
  if (!hide && !hasAliases) return payment
  return {
    ...payment,
    ...(hide ? { hideQuantityAndPrice: true } : {}),
    invoice: (payment.invoice ?? []).map((line) => {
      const alias = resolveServiceAlias(line, domain)
      return alias ? { ...line, alias } : line
    }),
  }
}
