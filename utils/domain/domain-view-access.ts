import { isAdminCheck } from '@utils/helpers'

/**
 * Fields rendered by the «Загальне» tab of the domain form — the only ones a
 * view-only reader is allowed to receive.
 *
 * Everything else on a Domain either backs an admin-only tab (Банк API,
 * Шаблон, Мої послуги, Історія налаштувань) or exists purely to edit the
 * domain, so it must never leave the server for a viewer — most importantly
 * `domainBankToken`, which carries the PrivatBank integration secret.
 */
export const DOMAIN_GENERAL_FIELDS = [
  '_id',
  'name',
  'adminEmails',
  'streets',
  'description',
  'iban',
  'rnokpp',
  'mfo',
] as const

/** Mongoose `.select()` projection built from {@link DOMAIN_GENERAL_FIELDS}. */
export const DOMAIN_GENERAL_PROJECTION = DOMAIN_GENERAL_FIELDS.join(' ')

/**
 * A domain viewer is any signed-in user without admin rights: they may preview
 * the provider their companies belong to, but get neither the admin-only tabs
 * in the UI nor the data behind them from the API. Unknown/absent roles count
 * as a viewer so both sides fail closed.
 */
export const isDomainViewer = (roles?: string[]): boolean =>
  !isAdminCheck(roles)
