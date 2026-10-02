import DebtCalculation from '@modules/models/DebtCalculation'
import DomainInflationOverride from '@modules/models/DomainInflationOverride'
import InflationIndex from '@modules/models/InflationIndex'
import Payment from '@modules/models/Payment'
import RealEstate from '@modules/models/RealEstate'
import Service from '@modules/models/Service'
import { ServiceType } from '@utils/constants'
import { findDomainIdsByServiceType } from '@utils/domain/domains-by-service-type'
import { mergeDomainIndexes } from '@utils/inflation-index/domain-overrides'
import { SERVICE_TIMEZONE } from '@utils/inflation-index/fill-services'
import { indexesByPeriod } from './build-input'
import {
  calculateCompanyDebt,
  defaultDebtPeriod,
  PREFILL_SERVICES_LIMIT,
} from './company-debt'
import { formatPeriod } from './months'
import { IPrefillPayment, IPrefillService } from './prefill'
import { IDebtCalculationSnapshot } from './serialize'
import { InflationMethod } from './types'

export interface IDebtorInflation {
  loss: number
  from: string
  to: string
  method: InflationMethod
}

const groupBy = <T>(items: T[], key: (item: T) => string): Map<string, T[]> => {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const id = key(item)
    groups.set(id, [...(groups.get(id) ?? []), item])
  }
  return groups
}

export async function calculateDebtorsInflation(
  companyIds: string[],
  now: Date = new Date()
): Promise<Record<string, IDebtorInflation>> {
  if (companyIds.length === 0) return {}

  const housingFeeDomains = new Set(
    await findDomainIdsByServiceType(ServiceType.HousingFee)
  )
  const companies = (
    await RealEstate.find(
      { _id: { $in: companyIds } },
      'domain totalArea pricePerMeter'
    ).lean()
  ).filter(({ domain }) => housingFeeDomains.has(String(domain)))
  if (companies.length === 0) return {}

  const ids = companies.map(({ _id }) => _id)
  const domainIds = [...new Set(companies.map(({ domain }) => String(domain)))]

  const [payments, services, indexes, saved, overrides] = await Promise.all([
    Payment.find(
      { company: { $in: ids } },
      'domain company type generalSum invoiceCreationDate paidAt monthService invoice'
    )
      .populate('monthService', 'date')
      .lean(),
    Service.find({ domain: { $in: domainIds } }, 'domain date rentPrice')
      .sort({ date: -1 })
      .lean(),
    InflationIndex.find({}, 'year month value').lean(),
    DebtCalculation.find({ company: { $in: ids } }).lean(),
    DomainInflationOverride.find(
      { domain: { $in: domainIds } },
      'domain year month value'
    ).lean(),
  ])

  const reference = indexesByPeriod(indexes)
  const overridesByDomain = groupBy(overrides, ({ domain }) => String(domain))
  const defaultPeriod = defaultDebtPeriod(now, SERVICE_TIMEZONE)
  const paymentsByCompany = groupBy(payments, ({ company }) => String(company))
  const servicesByDomain = groupBy(services, ({ domain }) => String(domain))

  const inflation: Record<string, IDebtorInflation> = {}

  for (const company of companies) {
    const companyId = String(company._id)
    const domainId = String(company.domain)

    const { result, period, inflationMethod } = calculateCompanyDebt({
      companyId,
      company,
      payments: (paymentsByCompany.get(companyId) ?? []).filter(
        ({ domain }) => String(domain) === domainId
      ) as unknown as IPrefillPayment[],
      services: (servicesByDomain.get(domainId) ?? []).slice(
        0,
        PREFILL_SERVICES_LIMIT
      ) as unknown as IPrefillService[],
      indexByPeriod: mergeDomainIndexes(
        reference,
        overridesByDomain.get(domainId) ?? []
      ),
      timeZone: SERVICE_TIMEZONE,
      saved: saved.find(
        (record) =>
          String(record.domain) === domainId &&
          String(record.company) === companyId
      ) as unknown as IDebtCalculationSnapshot | undefined,
      defaultPeriod,
    })

    inflation[companyId] = {
      loss: result.inflation,
      from: formatPeriod(period.from),
      to: formatPeriod(period.to),
      method: inflationMethod,
    }
  }

  return inflation
}
