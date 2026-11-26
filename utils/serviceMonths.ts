import type { IService } from '@common/api/serviceApi/service.api.types'
import dayjs, { Dayjs } from 'dayjs'

export type MonthPeriod = [Dayjs, Dayjs]

export interface IAddressOption {
  value: string
  label: string
}

export interface IServiceMonth {
  /** MM.YYYY */
  month: string
  /** Absent when the month has no service. */
  service?: IService
}

/** Address value of the month services saved without a street. */
export const NO_ADDRESS = 'none'

const getAddressKey = (service: IService): string =>
  service.street?._id ? String(service.street._id) : NO_ADDRESS

/** Addresses present among the services, in the order they first appear. */
export const getAddressOptions = (services: IService[]): IAddressOption[] => {
  const options = new Map<string, string>()

  services.forEach((service) => {
    const { address, city } = service.street ?? {}

    options.set(
      getAddressKey(service),
      address ? `${address} (м. ${city})` : 'Без адреси'
    )
  })

  return Array.from(options, ([value, label]) => ({ value, label }))
}

export const filterByAddress = (
  services: IService[],
  address: string
): IService[] =>
  services.filter((service) => getAddressKey(service) === address)

/**
 * Every calendar month of the period - or, without a period, from the first to
 * the last month that has a service. Empty when no service falls inside. The
 * services are expected to belong to a single address.
 */
export const getServiceMonths = (
  services: IService[],
  period?: MonthPeriod | null
): IServiceMonth[] => {
  const byMonth = new Map<string, IService>()

  // Nothing forbids two services for one month: the one created last wins
  // (an ObjectId starts with its creation time).
  ;[...services]
    .sort((a, b) => String(a._id).localeCompare(String(b._id)))
    .forEach((service) => {
      byMonth.set(dayjs(service.date).format('YYYY-MM'), service)
    })

  const keys = Array.from(byMonth.keys()).sort()
  if (!keys.length) return []

  const from = period?.[0].format('YYYY-MM') ?? keys[0]
  const to = period?.[1].format('YYYY-MM') ?? keys[keys.length - 1]
  if (!keys.some((key) => key >= from && key <= to)) return []

  const months: IServiceMonth[] = []
  for (
    let month = dayjs(`${from}-01`);
    month.format('YYYY-MM') <= to;
    month = month.add(1, 'month')
  ) {
    months.push({
      month: month.format('MM.YYYY'),
      service: byMonth.get(month.format('YYYY-MM')),
    })
  }

  return months
}
