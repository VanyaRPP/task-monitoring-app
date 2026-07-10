import Domain from '@modules/models/Domain'
import Payment from '@modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import Service from '@modules/models/Service'
import {
  getCreditDebitPipeline,
  getMaxInvoiceNumber,
  getServiceTotalsPipeline,
  getTotalGeneralSumPipeline,
} from '@pages/api/spacehub/payment/pipelines'
import { quarters, SortOrder } from '@utils/constants'
import {
  sendInvoiceEmail,
  type InvoiceEmailPayment,
} from '@utils/email/sendInvoiceEmail'
import { FilterQuery } from 'mongoose'
import ProfitService from '@common/services/profitService/profit.service'
import { isDev } from '@utils/env'

function isEmailDebugEnabled() {
  return process.env.EMAIL_DEBUG === 'true' || isDev
}

function maskEmail(email?: string) {
  if (!email) {
    return 'missing'
  }

  const [localPart = '', domainPart = ''] = email.split('@')

  if (!domainPart) {
    return `${localPart.slice(0, 2)}***`
  }

  return `${localPart.slice(0, 2)}***@${domainPart}`
}

function maskEmails(emails: string[] = []) {
  return emails.map((email) => maskEmail(email))
}

function logPaymentEmailDebug(stage: string, details: Record<string, unknown>) {
  if (!isEmailDebugEnabled()) {
    return
  }
  // eslint-disable-next-line no-console
  console.info(`[payment-email] ${stage}`, details)
}

export interface PaymentQueryParams {
  streetIds?: string | string[]
  companyIds?: string | string[]
  domainIds?: string | string[]
  serviceIds?: string | string[]
  limit?: string
  skip?: string
  type?: 'debit' | 'credit'
  year?: string | number
  month?: string | number | (string | number)[]
  quarter?: string | number
  day?: string | number
  dateField?: 'invoiceCreationDate' | 'date'
}

export interface UserContext {
  isUser: boolean
  isDomainAdmin: boolean
  isGlobalAdmin: boolean
  user: {
    email: string
  }
}

export async function getPayments(
  reqQuery: PaymentQueryParams,
  userContext: UserContext
) {
  const { isUser, isDomainAdmin, isGlobalAdmin, user } = userContext
  const { streetIds, companyIds, domainIds, serviceIds, limit, skip, type } =
    reqQuery

  const companiesIds: string[] | null = companyIds
    ? typeof companyIds === 'string'
      ? companyIds.split(',').map((id) => decodeURIComponent(id))
      : companyIds.map((id) => decodeURIComponent(id))
    : null
  const streetsIds: string[] | null = streetIds
    ? typeof streetIds === 'string'
      ? streetIds.split(',').map((id) => decodeURIComponent(id))
      : streetIds.map((id) => decodeURIComponent(id))
    : null
  const domainsIds: string[] | null = domainIds
    ? typeof domainIds === 'string'
      ? domainIds.split(',').map((id) => decodeURIComponent(id))
      : domainIds.map((id) => decodeURIComponent(id))
    : null
  const servicesIds: string[] | null = serviceIds
    ? typeof serviceIds === 'string'
      ? serviceIds.split(',').map((id) => decodeURIComponent(id))
      : serviceIds.map((id) => decodeURIComponent(id))
    : null
  const options: FilterQuery<typeof Payment> = {}

  if (isGlobalAdmin) {
    if (companiesIds) {
      options.company = { $in: companiesIds }
    }
    if (streetsIds) {
      options.street = { $in: streetIds }
    }
    if (domainsIds) {
      options.domain = { $in: domainsIds }
    }
  } else if (isDomainAdmin) {
    const relatedDomainsIds = (
      await Domain.find({
        adminEmails: user.email,
      })
    ).map((domain) => domain._id.toString())

    const companies = await RealEstate.find({
      ...(companiesIds ? { _id: { $in: companiesIds } } : {}),
      $or: [
        { adminEmails: user.email },
        { domain: { $in: relatedDomainsIds } },
      ],
    })

    options.company = {
      $in: companies.map(({ _id }) => _id.toString()),
    }

    if (streetsIds) {
      options.street = { $in: streetIds }
    }

    const domains = await Domain.find({
      ...(domainsIds ? { _id: { $in: domainsIds } } : {}),
      adminEmails: user.email,
    })

    options.domain = {
      $in: domains.map(({ _id }) => _id.toString()),
    }
  } else if (isUser) {
    const companies = await RealEstate.find({
      ...(companiesIds ? { _id: { $in: companiesIds } } : {}),
      adminEmails: user.email,
      ...(domainIds ? { domain: { $in: domainIds } } : {}),
    })

    options.company = {
      $in: companies.map(({ _id }) => _id.toString()),
    }
    options.domain = {
      $in: companies.map(({ domain }) => domain.toString()),
    }

    if (streetsIds) {
      options.street = { $in: streetIds }
    }
  }

  if (type) {
    options.type = type
  }
  // TODO: add security
  if (servicesIds) {
    options.monthService = { $in: servicesIds }
  }

  const expr = filterPeriodOptions(reqQuery)
  const dateField = reqQuery.dateField || 'invoiceCreationDate'
  if (expr.length > 0) {
    if (dateField === 'date') {
      const services = await Service.find({
        $expr: { $and: expr },
      }).select('_id')

      const serviceIds = services.map((service) => service._id.toString())
      options.monthService = { $in: serviceIds }
    } else {
      options.$expr = { $and: expr }
    }
  }

  const payments = await Payment.find(options)
    .sort({ invoiceCreationDate: SortOrder.DESC, type: SortOrder.ASC })
    .skip(+skip)
    .limit(+limit)
    .populate('company')
    .populate('street')
    .populate('domain')
    .populate('monthService')

  const total = await Payment.countDocuments(options)

  const [distinctDomainIds, distinctCompanyIds] = await Promise.all([
    Payment.distinct('domain', options),
    Payment.distinct('company', options),
  ])

  const creditDebitPipeline = getCreditDebitPipeline(options)
  const totalPayments = await Payment.aggregate(creditDebitPipeline)

  const genralSumPipeline = getTotalGeneralSumPipeline(options)
  const totalGeneralSum = await Payment.aggregate(genralSumPipeline)

  const serviceTotalsPipeline = getServiceTotalsPipeline(options)
  const serviceTotals = await Payment.aggregate(serviceTotalsPipeline)

  const totalPaymentsData = [
    ...totalPayments,
    ...totalGeneralSum,
    ...serviceTotals,
  ]
  return {
    currentCompaniesCount: distinctCompanyIds.length,
    currentDomainsCount: distinctDomainIds.length,
    data: payments,
    totalPayments: totalPaymentsData.reduce((acc, item) => {
      acc[item._id] = item.totalSum
      return acc
    }, {}),
    success: true,
    total,
  }
}

export async function getNextInvoiceNumber(): Promise<number> {
  const result = (await Payment.aggregate(getMaxInvoiceNumber())) as Array<{
    maxNumber?: number
  }>
  return (result[0]?.maxNumber ?? 0) + 1
}

export async function createPayment(
  body: any,
  isAdmin: boolean,
  options: { sendInvoiceEmail?: boolean } = {}
) {
  if (!isAdmin) throw new Error('not allowed')

  // Renamed locally to avoid shadowing the imported `sendInvoiceEmail` function.
  const { sendInvoiceEmail: shouldSendInvoiceEmail = true } = options

  const payment = await Payment.create(body)

  const description =
    payment.type === 'debit'
      ? `Інвойс №${payment.invoiceNumber}`
      : payment.description

  const profitObject = {
    domain: payment.domain.toString(),
    payment: payment.id.toString(),
    amount: payment.generalSum,
    type: payment.type as 'debit' | 'credit',
    date: payment.invoiceCreationDate,
    description,
    invoiceNumber: payment.invoiceNumber.toString(),
  }

  await ProfitService.create(profitObject)

  if (shouldSendInvoiceEmail && payment.type === 'debit') {
    try {
      logPaymentEmailDebug('prepare_started', {
        paymentId: payment.id?.toString?.() || 'unknown',
        invoiceNumber: payment.invoiceNumber,
        domainId: payment.domain?.toString?.() || 'unknown',
      })

      const paymentSnapshot = (
        typeof payment.toObject === 'function' ? payment.toObject() : payment
      ) as InvoiceEmailPayment
      const currentReceiver = paymentSnapshot.reciever || {}
      const shouldLoadDomainData =
        !currentReceiver.companyName ||
        !currentReceiver.description ||
        !currentReceiver.adminEmails?.length
      const domain =
        shouldLoadDomainData && payment.domain
          ? await Domain.findById(payment.domain).select(
              'adminEmails name description'
            )
          : null

      paymentSnapshot.reciever = {
        companyName: currentReceiver.companyName || domain?.name || 'invoice',
        adminEmails: currentReceiver.adminEmails?.length
          ? currentReceiver.adminEmails
          : domain?.adminEmails || [],
        description: currentReceiver.description || domain?.description || '',
      }

      logPaymentEmailDebug('receiver_resolved', {
        paymentId: payment.id?.toString?.() || 'unknown',
        invoiceNumber: payment.invoiceNumber,
        usedDomainFallback: Boolean(domain),
        recipients: maskEmails(paymentSnapshot.reciever.adminEmails),
        sender: maskEmail(
          process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || 'missing'
        ),
      })

      const emailSent = await sendInvoiceEmail(paymentSnapshot)

      logPaymentEmailDebug('send_finished', {
        paymentId: payment.id?.toString?.() || 'unknown',
        invoiceNumber: payment.invoiceNumber,
        emailSent,
      })
    } catch (error) {
      console.error('[payment-email] send_failed', {
        paymentId: payment.id?.toString?.() || 'unknown',
        invoiceNumber: payment.invoiceNumber,
        message: error?.message,
      })
    }
  }

  return payment
}

export interface DuplicatePaymentsPerms {
  isGlobalAdmin: boolean
  isDomainAdmin: boolean
  user: { email: string }
}

export interface DuplicatePaymentsResult {
  createdIds: string[]
  skippedIds: string[]
  totalRequested: number
}

// Fields that must NOT be carried over to a duplicate: identity/versioning
// (`_id`, `__v`), values we re-generate (`invoiceNumber`, `invoiceCreationDate`),
// and payment-specific state that a fresh copy should not inherit (`transaction`).
// A denylist keeps duplication resilient to new schema fields.
const NON_COPYABLE_PAYMENT_FIELDS = [
  '_id',
  '__v',
  'invoiceNumber',
  'invoiceCreationDate',
  'transaction',
] as const

export async function duplicatePayments(
  ids: string[],
  perms: DuplicatePaymentsPerms
): Promise<DuplicatePaymentsResult> {
  const { isGlobalAdmin, user } = perms

  const sources = await Payment.find({ _id: { $in: ids } })

  // Non-global admins may only duplicate payments within domains they administer.
  let allowedDomainIds: Set<string> | null = null
  if (!isGlobalAdmin) {
    const domains = await Domain.find({ adminEmails: user.email })
    allowedDomainIds = new Set(domains.map((d) => d._id.toString()))
  }

  const createdIds: string[] = []
  const skippedIds: string[] = []

  // Resolve the next invoice number once and increment locally, instead of
  // running a `$max` aggregation per payment inside the loop.
  let nextInvoiceNumber = await getNextInvoiceNumber()

  for (const source of sources) {
    const domainId = source.domain ? source.domain.toString() : null
    if (allowedDomainIds && (!domainId || !allowedDomainIds.has(domainId))) {
      skippedIds.push(source._id.toString())
      continue
    }

    const body = source.toObject() as Record<string, unknown>
    for (const field of NON_COPYABLE_PAYMENT_FIELDS) {
      delete body[field]
    }
    body.invoiceNumber = nextInvoiceNumber
    body.invoiceCreationDate = new Date()

    try {
      const created = await createPayment(body, true, {
        sendInvoiceEmail: false,
      })
      createdIds.push(created.id.toString())
      // Only advance the counter once the payment actually persisted, so a
      // failed create leaves the number free for the next duplicate.
      nextInvoiceNumber += 1
    } catch (error) {
      console.error('[payment-duplicate] create_failed', {
        sourceId: source._id.toString(),
        message: (error as Error)?.message,
      })
      skippedIds.push(source._id.toString())
    }
  }

  const notFoundIds = ids.filter(
    (id) => !sources.some((p) => p._id.toString() === id)
  )

  return {
    createdIds,
    skippedIds: [...skippedIds, ...notFoundIds],
    totalRequested: ids.length,
  }
}

function filterPeriodOptions(args) {
  const { year, quarter, day, dateField = 'invoiceCreationDate' } = args
  let { month } = args
  const field = `$${dateField}`

  if (typeof month === 'string') {
    month = month
      .split(',')
      .map(Number)
      .filter((m) => !isNaN(m))
  }

  const filterByDateOptions = []

  if (year && !isNaN(Number(year))) {
    filterByDateOptions.push({
      $eq: [{ $year: field }, +year],
    })
  }

  if (Array.isArray(month) && month.length > 0) {
    filterByDateOptions.push({
      $in: [{ $month: field }, month],
    })
  }

  if (quarter) {
    filterByDateOptions.push({
      $in: [{ $month: field }, quarters[+quarter]],
    })
  }

  if (day && !isNaN(Number(day))) {
    filterByDateOptions.push({
      $eq: [{ $dayOfMonth: field }, +day],
    })
  }
  return filterByDateOptions
}
