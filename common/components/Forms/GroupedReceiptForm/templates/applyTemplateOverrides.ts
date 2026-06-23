import {
  IInvoiceTemplateOverrides,
  LocalizedText,
} from '@common/api/invoiceTemplateApi/invoiceTemplate.api.types'

/**
 * Resolve the "chrome" (non-data presentation) of a template from its
 * `overrides`, falling back to the base layout's defaults. Shared by all four
 * templates so adding a new override field is a one-place change.
 *
 * `accentColor`/`invoiceTitle`/`footerText` resolved here; per-section labels are
 * resolved on demand via `getLabel`. `show.*` toggles are modeled but not yet consumed.
 */
export interface ResolvedTemplateChrome {
  accentColor?: string
  invoiceTitle?: string
  footerText?: string
}

export function pickLocalized(
  text: LocalizedText | undefined,
  isEnglish: boolean
): string | undefined {
  if (!text) return undefined
  const primary = isEnglish ? text.en : text.uk
  return primary ?? text.en ?? text.uk ?? undefined
}

export function resolveTemplateChrome(
  overrides: IInvoiceTemplateOverrides | undefined,
  isEnglish: boolean
): ResolvedTemplateChrome {
  return {
    accentColor: overrides?.accentColor || undefined,
    invoiceTitle: pickLocalized(overrides?.invoiceTitle, isEnglish),
    footerText: pickLocalized(overrides?.footerText, isEnglish),
  }
}

/**
 * Resolve a single localized label override by key, falling back to the
 * template's built-in default. Templates pass the default so read mode is
 * unchanged when no override exists.
 */
export function getLabel(
  overrides: IInvoiceTemplateOverrides | undefined,
  key: string,
  defaultValue: string,
  isEnglish: boolean
): string {
  return pickLocalized(overrides?.labels?.[key], isEnglish) ?? defaultValue
}
