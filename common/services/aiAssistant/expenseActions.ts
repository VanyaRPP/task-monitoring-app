import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import type { UserContext } from '@common/services/paymentService/payment.service'
import { companyOwnershipFilter } from '@common/services/aiAssistant/invoiceActions'
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

  if (companyId) {
    const company = await RealEstate.findOne({
      $and: [await companyOwnershipFilter(ctx), { _id: companyId }],
    })
    if (!company) throw new Error('company not accessible')
    return { type: 'company', id: companyId, label: company.companyName }
  }

  if (domainId) {
    const domain = await Domain.findOne({
      _id: domainId,
      ...(ctx.isGlobalAdmin ? {} : { adminEmails: ctx.user.email }),
    })
    if (!domain) throw new Error('domain not accessible')
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
  const lines = normalizeProfitItems(
    items.map((item) => ({ ...item, amount: Math.abs(Number(item.amount)) }))
  )
  if (!lines.ok) throw new Error(lines.error)

  const warnings: string[] = []
  items.forEach((item, index) => {
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
