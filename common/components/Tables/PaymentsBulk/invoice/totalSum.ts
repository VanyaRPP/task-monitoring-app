import { invoiceCSFilter, toRoundFixed } from '@utils/helpers'

type InvoiceLike = { sum?: number | string | null; fieldName?: string }

/**
 * Загальна сума компанії — та сама формула, що й generalSum при збереженні
 * (Header.tsx): усі виставлені послуги (sum != 0) без службових полів.
 * Рахується по ВСІХ послугах у формі, тож приховування колонки на неї не
 * впливає — ховається лише відображення. Без послуг -> 0.
 */
export const calcCompanyTotal = (
  invoice?: Record<string, InvoiceLike> | null
): number => {
  const items = Object.values(invoice ?? {}).filter((inv) => inv?.sum)
  const total = invoiceCSFilter(items).reduce(
    (acc: number, inv: InvoiceLike) => acc + (+inv.sum || 0),
    0
  )
  return +toRoundFixed(total)
}

/** Рядки, з яких складається сума (для підказки): що саме і скільки. */
export const listCompanyTotalItems = (
  invoice?: Record<string, InvoiceLike & { name?: string }> | null
): { label: string; sum: number }[] =>
  invoiceCSFilter(Object.values(invoice ?? {}).filter((inv) => inv?.sum)).map(
    (inv: InvoiceLike & { name?: string; type?: string }) => ({
      label: inv.name || inv.fieldName || inv.type || '—',
      sum: +toRoundFixed(+inv.sum || 0),
    })
  )
