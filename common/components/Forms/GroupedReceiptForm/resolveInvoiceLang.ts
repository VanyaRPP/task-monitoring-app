import { Currency } from '@utils/constants'
import { normalizeCurrency } from '@utils/helpers'

interface LangSource {
  invoiceLang?: 'en' | 'uk' | null
  currency?: string | null
}

export function resolveInvoiceLang(payment?: LangSource | null): 'en' | 'uk' {
  if (payment?.invoiceLang === 'en' || payment?.invoiceLang === 'uk') {
    return payment.invoiceLang
  }

  return payment?.currency &&
    normalizeCurrency(payment.currency) !== Currency.UAH
    ? 'en'
    : 'uk'
}
