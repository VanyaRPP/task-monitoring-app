import Domain from '@modules/models/Domain'
import Payment from '@modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import Service from '@modules/models/Service'
import {
  getCreditDebitPipeline,
  getInvoicesTotalPipeline,
  getTotalGeneralSumPipeline,
} from '@pages/api/spacehub/payment/pipelines'
import { quarters } from '@utils/constants'
import {
  getDistinctCompanyAndDomain,
  getFilterForAddress,
} from '@utils/helpers'
import { getStreetsPipeline } from '@utils/pipelines'
import { FilterQuery } from 'mongoose'
import ProfitService from '@common/services/profitService/profit.service'
import mongoose from 'mongoose'

export interface PaymentQueryParams {
  streetIds?: string | string[]
  companyIds?: string | string[]
  domainIds?: string | string[]
  serviceIds?: string | string[]
  limit?: string
  skip?: string
  type?: 'debit' | 'credit'
  dateField?: 'invoiceCreationDate' | 'monthService.date' | 'date'
  year?: string | number
  month?: string | number | (string | number)[]
  quarter?: string | number
  day?: string | number
}

export interface UserContext {
  isUser: boolean
  isDomainAdmin: boolean
  isGlobalAdmin: boolean
  user: {
    email: string
  }
}

function parseCommaParam(param?: string | string[] | undefined) {
  if (!param) return null
  if (Array.isArray(param)) return param
  return String(param).split(',').map((p) => decodeURIComponent(p))
}

function toObjectIdIfValid(id: any) {
  try {
    if (mongoose.Types.ObjectId.isValid(String(id))) return new mongoose.Types.ObjectId(String(id))
  } catch {
  }
  return id
}

export async function getPayments(reqQuery: PaymentQueryParams, userContext: UserContext) {
  const { isUser, isDomainAdmin, isGlobalAdmin, user } = userContext
  const { streetIds, companyIds, domainIds, serviceIds, limit = '10', skip = '0', type, dateField } = reqQuery

  const companiesIds = parseCommaParam(companyIds as any)
  const streetsIds = parseCommaParam(streetIds as any)
  const domainsIds = parseCommaParam(domainIds as any)
  const servicesIds = parseCommaParam(serviceIds as any)

  const options: FilterQuery<typeof Payment> = {}

  if (isGlobalAdmin) {
    if (companiesIds) {
      options.company = { $in: companiesIds.map(String) }
    }
    if (streetsIds) {
      options.street = { $in: streetsIds.map(String) }
    }
    if (domainsIds) {
      options.domain = { $in: domainsIds.map(String) }
    }
  } else if (isDomainAdmin) {
    const relatedDomainsIds = (await Domain.find({ adminEmails: user.email })).map((d) => d._id.toString())

    const companies = await RealEstate.find({
      ...(companiesIds ? { _id: { $in: companiesIds } } : {}),
      $or: [{ adminEmails: user.email }, { domain: { $in: relatedDomainsIds } }],
    }).lean()

    options.company = {
      $in: companies.map(({ _id }) => _id.toString()),
    }

    if (streetsIds) {
      options.street = { $in: streetIds }
    }

    const domains = await Domain.find({
      ...(domainsIds ? { _id: { $in: domainsIds } } : {}),
      adminEmails: user.email,
    }).lean()

    options.domain = { $in: domains.map((d) => String(d._id)) }
  } else if (isUser) {
    const companies = await RealEstate.find({
      ...(companiesIds ? { _id: { $in: companiesIds } } : {}),
      adminEmails: user.email,
      ...(domainsIds ? { domain: { $in: domainsIds as any } } : {}),
    }).lean()

    options.company = { $in: companies.map((c) => String(c._id)) }
    options.domain = { $in: companies.map((c) => String((c as any).domain)) }

    if (streetsIds) options.street = { $in: streetsIds }
  }

  if (type) options.type = type

  if (servicesIds) {
    const normalized = servicesIds.map((id) => String(id))
    options.monthService = { $in: normalized.map((id) => toObjectIdIfValid(id)) }
  }

  const parseKey = (val?: string | number | string[] | number[]) => {
    if (!val) return null
    const raw = Array.isArray(val) ? String(val[0]) : String(val)
    const monthMatch = raw.match(/^(\d{4})-month-(\d{1,2})$/)
    if (monthMatch) {
      return { 
        type: 'month' as const, 
        year: Number(monthMatch[1]), 
        month: Number(monthMatch[2]) 
      }
    }
    const quarterMatch = raw.match(/^(\d{4})-quarter-(\d)$/)
    if (quarterMatch) { 
      return { 
        type: 'quarter' as const, 
        year: Number(quarterMatch[1]), 
        quarter: Number(quarterMatch[2]) 
      }
    }
    return null
  }

  const expr = filterPeriodOptions(reqQuery)
  const dateFieldResolved = dateField || 'invoiceCreationDate'

  async function applyMonthServiceFilter(q: PaymentQueryParams, opts: any) {
    const normalizeToArray = (input?: string | number | (string | number)[]) => {
      if (input == null) return []
      if (Array.isArray(input)) return input.map(String)
      return String(input).split(',').map((v) => v.trim()).filter(Boolean)
    }

    const rawMonths: string[] = [
      ...normalizeToArray(q.month),
      ...normalizeToArray((q as any).monthService),
    ]

    if (!rawMonths.length) {
      console.log('applyMonthServiceFilter: no rawMonths -> skip')
      return
    }

    if (
      rawMonths.length &&
      q.year &&
      !String(rawMonths[0]).includes('month') &&
      !String(rawMonths[0]).includes('quarter')
    ) {
      const years = Array.isArray(q.year) ? q.year.map(String) : [String(q.year)]
      const expanded: string[] = []
      for (const y of years) {
        for (const m of rawMonths) {
          expanded.push(`${y}-month-${m}`)
        }
      }
      console.log('applyMonthServiceFilter: auto-expanded rawMonths →', expanded)
      rawMonths.splice(0, rawMonths.length, ...expanded)
    }

    const parsed = rawMonths
      .map((v) => {
        const raw = String(v)
        const m = raw.match(/^(\d{4})-month-(\d{1,2})$/)
        if (m)
          return {
            type: 'month' as const,
            year: Number(m[1]),
            month: Number(m[2]),
          }
        const qM = raw.match(/^(\d{4})-quarter-(\d)$/)
        if (qM)
          return {
            type: 'quarter' as const,
            year: Number(qM[1]),
            quarter: Number(qM[2]),
          }
        return null
      })
      .filter(Boolean) as Array<{
        type: 'month' | 'quarter'
        year: number
        month?: number
        quarter?: number
      }>

    if (!parsed.length) {
      console.log('applyMonthServiceFilter: parsed is empty -> skip', { rawMonths })
      return
    }

    const years = Array.from(new Set(parsed.map((p) => p.year)))
    const months = Array.from(
      new Set(parsed.filter((p) => p.type === 'month').map((p) => p.month!).filter(Boolean))
    )
    const quarters = Array.from(
      new Set(parsed.filter((p) => p.type === 'quarter').map((p) => p.quarter!).filter(Boolean))
    )

    const ranges: { start: Date; end: Date }[] = []
    for (const y of years) {
      for (const m of months) {
        ranges.push({
          start: new Date(y, Number(m) - 1, 1),
          end: new Date(y, Number(m), 1),
        })
      }
    }

    const quarterMap: Record<number, number[]> = {
      1: [1, 2, 3],
      2: [4, 5, 6],
      3: [7, 8, 9],
      4: [10, 11, 12],
    }

    for (const y of years) {
      for (const q of quarters) {
        const monthsForQ = quarterMap[Number(q)] || []
        for (const m of monthsForQ) {
          ranges.push({
            start: new Date(y, m - 1, 1),
            end: new Date(y, m, 1),
          })
        }
      }
    }

    if (!ranges.length) {
      console.log('applyMonthServiceFilter: no ranges -> skip', { years, months, quarters })
      return
    }

    const orConditions = ranges.map((r) => ({
      date: { $gte: r.start, $lt: r.end },
    }))

    const serviceIds: any[] = await Service.distinct('_id', { $or: orConditions })
    const uniqueIds = Array.from(new Set((serviceIds || []).map((id) => String(id))))
    const finalIds = uniqueIds.map(id => String(id))
    opts.monthService = { $in: finalIds }
  }


  if (dateFieldResolved === 'monthService.date') {
    await applyMonthServiceFilter(reqQuery, options)
  } else if (expr.length > 0) {
    options.$expr = { $and: expr }
  }

  const payments = await Payment.find(options)
    .sort({ invoiceCreationDate: -1 })
    .skip(Number(skip || 0))
    .limit(Number(limit || 10))
    .populate('company')
    .populate('street')
    .populate('domain')
    .populate('monthService')

  const streetsPipeline = getStreetsPipeline(isGlobalAdmin, options.domain)

  const streets = await Payment.aggregate(streetsPipeline)
  const addressFilter = getFilterForAddress(streets)

  const total = await Payment.countDocuments(options)

  const { distinctDomains, distinctCompanies } =
    await getDistinctCompanyAndDomain({
      isGlobalAdmin,
      user,
      companyGroup: 'company',
      model: Payment,
      filters: {},
    })

  const creditDebitPipeline = getCreditDebitPipeline(options)
  const totalPayments = await Payment.aggregate(creditDebitPipeline)

  const invoicesPipeline = getInvoicesTotalPipeline(options)
  const totalInvoices = await Payment.aggregate(invoicesPipeline)

  const genralSumPipeline = getTotalGeneralSumPipeline(options)
  const totalGeneralSum = await Payment.aggregate(genralSumPipeline)

  const totalPaymentsData = [...totalPayments, ...totalInvoices, ...totalGeneralSum]

  return {
    currentCompaniesCount: distinctCompanies.length,
    currentDomainsCount: distinctDomains.length,
    data: payments,
    totalPayments: totalPaymentsData.reduce((acc: any, item: any) => {
      acc[item._id] = item.totalSum
      return acc
    }, {}),
    success: true,
    total,
  }
}

function filterPeriodOptions(args: Partial<PaymentQueryParams>) {
  const { year, quarter, day, dateField = 'invoiceCreationDate' } = args
  let { month } = args
  const field = `$${dateField}`

  if (typeof month === 'string') {
    month = month
      .split(',')
      .map(Number)
      .filter((m) => !isNaN(m))
  }

  const filterByDateOptions: any[] = []

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
export async function createPayment(body: any, isAdmin: boolean) {
  if (!isAdmin) throw new Error('not allowed')
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

  return payment
}

