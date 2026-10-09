import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import Service from '@modules/models/Service'
import { getInvoices } from '@utils/getInvoices'
import { getPaymentProviderAndReciever, toRoundFixed } from '@utils/helpers'
import {
  getNextInvoiceNumber,
  getPayments,
  type UserContext,
} from '@common/services/paymentService/payment.service'
import type { FilterQuery } from 'mongoose'

/**
 * Building blocks for the AI-assisted invoice flow.
 *
 * Everything here runs on the server with a `userContext` derived from the
 * session (never from the model). Each read applies the same role/ownership
 * filtering the REST handlers use, so the assistant can never resolve or act on
 * an entity the user isn't allowed to see. `buildInvoiceDraft` is a pure
 * assembler (no DB write) shared by the preview and create tools, so a created
 * invoice is always identical to the one the user approved.
 */

/**
 * Ownership filter shared by domain/company lookups. Mirrors the access rules
 * in the REST GET handlers (e.g. pages/api/real-estate/index.ts):
 * GlobalAdmin sees everything; DomainAdmin is scoped to domains they administer
 * (and companies they co-admin); a plain User only sees what they own.
 */
async function domainOwnershipFilter(
  ctx: UserContext
): Promise<FilterQuery<typeof Domain>> {
  if (ctx.isGlobalAdmin) return {}
  return { adminEmails: ctx.user.email }
}

export interface DomainMatch {
  id: string
  name: string
  description: string
}

export async function findDomainsByName(
  name: string,
  ctx: UserContext
): Promise<DomainMatch[]> {
  const filter = await domainOwnershipFilter(ctx)
  const domains = await Domain.find({
    ...filter,
    name: { $regex: name, $options: 'i' },
  }).limit(10)

  return domains.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    description: d.description ?? '',
  }))
}

export interface CompanyMatch {
  id: string
  companyName: string
  domainId: string
  domainName: string
}

/**
 * Which companies the user may see - same scoping as
 * pages/api/real-estate/index.ts. Shared by every company lookup the assistant
 * does, so none of them can widen access by accident.
 */
export async function companyOwnershipFilter(
  ctx: UserContext
): Promise<FilterQuery<typeof RealEstate>> {
  if (ctx.isGlobalAdmin) return {}

  if (ctx.isDomainAdmin) {
    const domainIds = await Domain.distinct('_id', {
      adminEmails: ctx.user.email,
    })
    return {
      $or: [
        { domain: { $in: domainIds.map((id) => id.toString()) } },
        { adminEmails: ctx.user.email },
      ],
    }
  }

  return { adminEmails: ctx.user.email }
}

export async function findCompaniesByName(
  name: string,
  ctx: UserContext,
  domainId?: string
): Promise<CompanyMatch[]> {
  const options = await companyOwnershipFilter(ctx)

  const companies = await RealEstate.find({
    $and: [
      options,
      {
        companyName: { $regex: name, $options: 'i' },
        ...(domainId ? { domain: domainId } : {}),
      },
    ],
  })
    .limit(10)
    .populate('domain')

  return companies.map((c) => ({
    id: c._id.toString(),
    companyName: c.companyName,
    domainId: (c.domain as any)?._id?.toString() ?? '',
    domainName: (c.domain as any)?.name ?? '',
  }))
}

/**
 * Finds the Service (monthly tariffs) record for a domain/street/month, or
 * `null` when the month has none yet. Read-only: the preview must not write,
 * so a missing Service is created by the form on save (via the month
 * placeholder, see `useResolveMonthServiceId`) - not here.
 *
 * Without a street only a street-less Service matches: dropping the filter
 * would pick any street's tariffs in that domain.
 */
export async function findMonthService(
  domainId: string,
  street: string | undefined,
  year: number,
  month: number,
  ctx: UserContext
) {
  // Access guard: the caller must be able to see this specific domain.
  if (!ctx.isGlobalAdmin) {
    const canAccess = await Domain.exists({
      _id: domainId,
      adminEmails: ctx.user.email,
    })
    if (!canAccess) {
      throw new Error('domain not accessible')
    }
  }

  const monthStart = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0))
  const monthEnd = new Date(Date.UTC(year, month, 1, 12, 0, 0))

  return Service.findOne({
    domain: domainId,
    street: street ?? null,
    date: { $gte: monthStart, $lt: monthEnd },
  })
}

export interface ExtraLine {
  name: string
  sum: number
}

export interface BuildInvoiceDraftParams {
  companyId: string
  month: number
  year: number
  /** Extra fixed lines the user asked for, e.g. { name: 'Оренда', sum: 5000 }. */
  extraLines?: ExtraLine[]
  ctx: UserContext
}

/**
 * Assembles a full payment draft (an `IPayment`-shaped object) WITHOUT writing
 * to the DB. Shared core of the preview and create tools — building it in one
 * place guarantees the created invoice equals the previewed one.
 */
export async function buildInvoiceDraft({
  companyId,
  month,
  year,
  extraLines = [],
  ctx,
}: BuildInvoiceDraftParams) {
  const company = await RealEstate.findById(companyId).populate('domain')
  if (!company) throw new Error('company not found')

  const domainId = (company.domain as any)?._id?.toString()
  const street = company.street ? company.street.toString() : undefined

  const service = await findMonthService(domainId, street, year, month, ctx)

  // Previous month's payment seeds meter/previous-amount data for getInvoices.
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevPayments = await getPayments(
    {
      companyIds: companyId,
      type: 'debit',
      year: prevYear,
      month: prevMonth,
      limit: '1',
      skip: '0',
    },
    ctx
  )
  const prevPayment = prevPayments.data?.[0]

  // Existing pure logic: line prices come from the Service (0 without one),
  // previous readings from prevPayment.
  const generatedInvoice = getInvoices({
    company: company as any,
    service: (service ?? undefined) as any,
    prevPayment: prevPayment as any,
  })

  const extraInvoiceLines = extraLines.map((line) => ({
    type: 'custom',
    name: line.name,
    customName: line.name,
    customService: true,
    price: line.sum,
    sum: line.sum,
  }))

  const invoice = [...generatedInvoice, ...extraInvoiceLines].filter(
    (line) => +line.sum !== 0
  )
  const generalSum = invoice.reduce((acc, line) => acc + +line.sum, 0)

  const { provider, reciever } = getPaymentProviderAndReciever(company)
  const invoiceNumber = await getNextInvoiceNumber()

  return {
    invoiceNumber,
    type: 'debit',
    domain: domainId,
    ...(street ? { street } : {}),
    company: companyId,
    // null when the month has no Service yet - the form resolves `period`
    // into its month placeholder and creates the Service on save.
    monthService: service ? service._id.toString() : null,
    /** The billed month; `invoiceCreationDate` is the day it is issued. */
    period: { year, month },
    invoiceCreationDate: new Date(),
    description: '',
    generalSum,
    currency: (company as any).currency || 'UAH',
    provider,
    reciever,
    invoice,
    template: (company as any).defaultTemplate || 'classic',
    invoiceLang: 'uk' as const,
  }
}

export interface BuildCreditDraftParams {
  companyId: string
  /** Positive; a credit is money received. */
  amount: number
  /** Billed month the payment settles (its month service). */
  month: number
  year: number
  /** `YYYY-MM-DD` the money came in; today when absent. */
  date?: string
  description?: string
  ctx: UserContext
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/**
 * A received payment (credit) for AddPaymentModal to open prefilled - same
 * fields as the bank's quick-send credit. Nothing is written: the month's
 * Service, when missing, is created by the form on save (see `period`).
 */
export async function buildCreditDraft({
  companyId,
  amount,
  month,
  year,
  date,
  description,
  ctx,
}: BuildCreditDraftParams) {
  const sum = Math.abs(Number(amount))
  if (!Number.isFinite(sum) || sum <= 0) {
    throw new Error('amount must be a positive number')
  }

  // Only a company the user may bill - the same scoping as findCompanies.
  const company = await RealEstate.findOne({
    $and: [await companyOwnershipFilter(ctx), { _id: companyId }],
  }).populate('domain')
  if (!company) throw new Error('company not accessible')

  const domainId = (company.domain as any)?._id?.toString()
  const street = company.street ? company.street.toString() : undefined
  const service = await findMonthService(domainId, street, year, month, ctx)

  const { provider, reciever } = getPaymentProviderAndReciever(company)
  const invoiceNumber = await getNextInvoiceNumber()
  const period = { year, month }

  return {
    invoiceNumber,
    type: 'credit' as const,
    domain: domainId,
    ...(street ? { street } : {}),
    company: companyId,
    monthService: service ? service._id.toString() : null,
    period,
    invoiceCreationDate: date && ISO_DAY.test(date) ? date : new Date(),
    description:
      description?.trim() ||
      `Оплата за ${String(month).padStart(2, '0')}.${year}`,
    generalSum: Number(toRoundFixed(sum)),
    currency: (company as any).currency || 'UAH',
    provider,
    reciever,
    invoice: [],
  }
}
