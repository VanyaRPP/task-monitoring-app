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
    .sort({ invoiceCreationDate: -1 })
    .skip(+skip)
    .limit(+limit)
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

  const totalPaymentsData = [
    ...totalPayments,
    ...totalInvoices,
    ...totalGeneralSum,
  ]
  return {
    currentCompaniesCount: distinctCompanies.length,
    currentDomainsCount: distinctDomains.length,
    data: payments,
    totalPayments: totalPaymentsData.reduce((acc, item) => {
      acc[item._id] = item.totalSum
      return acc
    }, {}),
    success: true,
    total,
  }
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
