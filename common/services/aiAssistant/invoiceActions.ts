import Domain from '@modules/models/Domain'
import RealEstate from '@modules/models/RealEstate'
import Service from '@modules/models/Service'
import { getInvoices } from '@utils/getInvoices'
import { getPaymentProviderAndReciever } from '@utils/helpers'
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

export async function findCompaniesByName(
  name: string,
  ctx: UserContext,
  domainId?: string
): Promise<CompanyMatch[]> {
  const options: FilterQuery<typeof RealEstate> = {}

  // Same ownership scoping as pages/api/real-estate/index.ts.
  if (ctx.isGlobalAdmin) {
    // no restriction
  } else if (ctx.isDomainAdmin) {
    const domainIds = await Domain.distinct('_id', {
      adminEmails: ctx.user.email,
    })
    options.$or = [
      { domain: { $in: domainIds.map((id) => id.toString()) } },
      { adminEmails: ctx.user.email },
    ]
  } else {
    options.adminEmails = ctx.user.email
  }

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
 * creates an empty one (all prices 0) if none exists yet. Mirrors the client
 * hook `useResolveMonthServiceId`, but in the service layer without RTK Query.
 *
 * An empty Service is intentional: invoice line prices come from whatever the
 * user has (or hasn't) filled in for that month, so a missing Service simply
 * yields zero-value lines rather than an error.
 */
export async function resolveMonthService(
  domainId: string,
  street: string | undefined,
  year: number,
  month: number,
  ctx: UserContext
): Promise<any> {
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

  const existing = await Service.findOne({
    domain: domainId,
    ...(street ? { street } : {}),
    date: { $gte: monthStart, $lt: monthEnd },
  })
  if (existing) return existing

  return Service.create({
    domain: domainId,
    // street is optional; sending '' fails the ObjectId cast on the backend.
    ...(street ? { street } : {}),
    date: monthStart,
    rentPrice: 0,
    electricityPrice: 0,
    waterPrice: 0,
    waterPriceTotal: 0,
    description: '',
    customServices: [],
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

  const service = await resolveMonthService(domainId, street, year, month, ctx)

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

  // Existing pure logic: line prices come from the Service, previous readings
  // from prevPayment, otherwise 0.
  const generatedInvoice = getInvoices({
    company: company as any,
    service: service as any,
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
    monthService: service._id.toString(),
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
