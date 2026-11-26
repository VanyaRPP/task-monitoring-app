import type { IService } from '@common/api/serviceApi/service.api.types'
import { ServiceType } from '@utils/constants'
import {
  getLossesPercent,
  getPriceWithoutVat,
  getTotalWithVat,
} from '@utils/electricity'
import { getServiceMonths, MonthPeriod } from '@utils/serviceMonths'

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

/** One row per month of the period, see `getServiceMonths`. */
export const buildElectricityRows = (
  services: IService[],
  period?: MonthPeriod | null
): IElectricityRow[] =>
  getServiceMonths(services, period).map(({ month, service }) =>
    toRow(month, service)
  )
