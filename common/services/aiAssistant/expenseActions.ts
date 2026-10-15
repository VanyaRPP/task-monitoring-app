import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { canAccessProfitTarget } from '@common/services/profitService/profitAccess'
import { multiplyFloat, normalizeCurrency } from '@utils/helpers'
import { normalizeProfitItems, type IProfitItem } from '@utils/profit-items'

/**
 * Builds the draft behind the `previewExpenses` tool: a hand-entered Profit
 * record with line items, for AddCostModal to open prefilled. Nothing is
 * written - the user saves from the form, through the same API as by hand.
 */

export interface ExpenseLineInput {
  category?: string
  /** The model is told to send it positive; the sign is the record's type. */
  amount: number
  description?: string
  /** How the line was written, e.g. «13*200» - checked against `amount`. */
  expression?: string
}

export interface BuildExpenseDraftParams {
  type: 'debit' | 'credit'
  domainId?: string
  companyId?: string
  date?: string
  periodMonth?: string
  currency?: string
  description?: string
  items: ExpenseLineInput[]
  ctx: UserContext
}

/** Same shape as AddCostModal's ActiveScope - the ledger the record goes to. */
export interface ExpenseScope {
  type: 'domain' | 'company'
  id: string
  label: string
}

export interface ExpenseDraft {
  type: 'debit' | 'credit'
  scope: ExpenseScope | null
  date?: string
  periodMonth?: string
  currency: string
  description?: string
  items: IProfitItem[]
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const MONTH = /^\d{4}-\d{2}$/
// «13*200», «13 x 200», «13×200» - the only arithmetic receipts are written in.
const PRODUCT = /^\s*(\d+(?:[.,]\d+)?)\s*[*xх×]\s*(\d+(?:[.,]\d+)?)\s*$/i

/** «13*200» as the note shows it: «13 × 200»; null for anything else. */
function productNote(expression?: string): string | null {
  const match = expression ? PRODUCT.exec(expression) : null
  return match ? `${match[1]} × ${match[2]}` : null
}

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

/**
 * A line as the form should show it: what it is in «Категорія», the rest in
 * «Примітка». The model sometimes puts the line's name («Цукерки») in the
 * note and leaves no category; a note of a word or two with no category is
 * that name. A «13*200» the line was written as becomes part of the note.
 */
export function tidyExpenseLine(item: ExpenseLineInput): ExpenseLineInput {
  let category = item.category?.trim() || undefined
  let description = item.description?.trim() || undefined
  if (!category && description && description.split(/\s+/).length <= 2) {
    category = capitalize(description)
    description = undefined
  }
  const product = productNote(item.expression)
  const plain = (value = '') => value.replace(/\s/g, '').replace(/[*xх]/gi, '×')
  if (product && !plain(description).includes(plain(product))) {
    description = description ? `${description}, ${product}` : product
  }
  return { ...item, category, description }
}

/** The value of «a*b», or null for anything else. */
export function evaluateProduct(expression: string): number | null {
  const match = PRODUCT.exec(expression)
  if (!match) return null
  const [a, b] = [match[1], match[2]].map((n) => Number(n.replace(',', '.')))
  return multiplyFloat(a, b)
}

async function resolveScope(
  {
    domainId,
    companyId,
  }: Pick<BuildExpenseDraftParams, 'domainId' | 'companyId'>,
  ctx: UserContext
): Promise<ExpenseScope | null> {
  if (domainId && companyId) {
    throw new Error('provide either domainId or companyId, not both')
  }

  // The same rule the profits API applies on save (canAccessProfitTarget):
  // a draft must not point at a ledger the user could not write to.
  const access = { isGlobalAdmin: ctx.isGlobalAdmin, user: ctx.user }

  if (companyId) {
    const company = await RealEstate.findById(companyId)
    if (
      !company ||
      !(await canAccessProfitTarget({ company: companyId }, access))
    ) {
      throw new Error('company not accessible')
    }
    return { type: 'company', id: companyId, label: company.companyName }
  }

  if (domainId) {
    const domain = await Domain.findById(domainId)
    if (
      !domain ||
      !(await canAccessProfitTarget({ domain: domainId }, access))
    ) {
      throw new Error('domain not accessible')
    }
    return { type: 'domain', id: domainId, label: domain.name }
  }

  // Not named: the form asks for the domain.
  return null
}

export async function buildExpenseDraft({
  type,
  domainId,
  companyId,
  date,
  periodMonth,
  currency,
  description,
  items,
  ctx,
}: BuildExpenseDraftParams): Promise<{
  draft: ExpenseDraft
  warnings: string[]
}> {
  const scope = await resolveScope({ domainId, companyId }, ctx)

  // «-2600» in a list means an expense, which `type` already says; the
  // amount itself is always stored positive.
  const tidy = items.map(tidyExpenseLine)
  const lines = normalizeProfitItems(
    tidy.map((item) => ({ ...item, amount: Math.abs(Number(item.amount)) }))
  )
  if (!lines.ok) throw new Error(lines.error)

  const warnings: string[] = []
  tidy.forEach((item, index) => {
    if (!item.expression) return
    const value = evaluateProduct(item.expression)
    const amount = lines.items[index].amount
    if (value !== null && value !== amount) {
      warnings.push(
        `«${item.category ?? item.description ?? index + 1}»: ${item.expression} = ${value}, а вказано ${amount}`
      )
    }
  })

  return {
    draft: {
      type,
      scope,
      ...(date && DATE.test(date) ? { date } : {}),
      ...(periodMonth && MONTH.test(periodMonth) ? { periodMonth } : {}),
      currency: normalizeCurrency(currency),
      ...(description?.trim() ? { description: description.trim() } : {}),
      items: lines.items,
    },
    warnings,
  }
}
