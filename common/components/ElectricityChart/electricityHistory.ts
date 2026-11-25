import type { IService } from '@common/api/serviceApi/service.api.types'
import { ServiceType } from '@utils/constants'
import {
  getLossesPercent,
  getPriceWithoutVat,
  getTotalWithVat,
} from '@utils/electricity'
import dayjs, { Dayjs } from 'dayjs'

/** One month of the chart; `null` leaves a gap in the line. */
export interface IElectricityRow {
  /** MM.YYYY */
  month: string
  tariffWithVat: number | null
  tariffWithoutVat: number | null
  totalWithVat: number | null
  totalWithoutVat: number | null
  consumed: number | null
  losses: number | null
}

export interface IAddressOption {
  value: string
  label: string
}

export type MonthPeriod = [Dayjs, Dayjs]

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

const round = (value: number | null): number | null =>
  value === null ? null : Number(value.toFixed(2))

const toRow = (month: string, service?: IService): IElectricityRow => {
  const priceWithVat =
    service?.customServices?.find(
      (item) => item.fieldName === ServiceType.Electricity
    )?.price ||
    service?.electricityPrice ||
    null
  const totalWithoutVat = service?.generalElectricity || null
  const consumed = service?.consumedElectricity || null

  const calculated = getLossesPercent({
    priceWithVat,
    consumed,
    totalWithoutVat,
  })
  const saved = service?.losses
  // The saved value wins: it is editable by hand and it is what invoices use.
  // Without the inputs only a positive one means anything - 0 is the schema
  // default and a negative one is left over from an unfinished calculation.
  const losses =
    calculated === null
      ? saved > 0
        ? saved
        : null
      : (saved ?? round(calculated))

  return {
    month,
    tariffWithVat: round(priceWithVat),
    tariffWithoutVat: round(
      priceWithVat === null ? null : getPriceWithoutVat(priceWithVat)
    ),
    totalWithVat: round(
      totalWithoutVat === null ? null : getTotalWithVat(totalWithoutVat)
    ),
    totalWithoutVat: round(totalWithoutVat),
    consumed: round(consumed),
    losses,
  }
}

/**
 * One row per calendar month of the period - or, without a period, from the
 * first to the last month that has a service. Empty when nothing falls inside.
 * The services are expected to belong to a single address.
 */
export const buildElectricityRows = (
  services: IService[],
  period?: MonthPeriod | null
): IElectricityRow[] => {
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

  const rows: IElectricityRow[] = []
  for (
    let month = dayjs(`${from}-01`);
    month.format('YYYY-MM') <= to;
    month = month.add(1, 'month')
  ) {
    rows.push(
      toRow(month.format('MM.YYYY'), byMonth.get(month.format('YYYY-MM')))
    )
  }

  return rows
}
