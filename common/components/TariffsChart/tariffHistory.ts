import type { IService } from '@common/api/serviceApi/service.api.types'
import { ServiceName, ServiceType } from '@utils/constants'
import { getServiceMonths, MonthPeriod } from '@utils/serviceMonths'
import Big from 'big.js'

export interface ITariffPoint {
  /** MM.YYYY */
  month: string
  /** `null` leaves a gap in the line. */
  value: number | null
}

export interface ITariffSeries {
  key: string
  name: string
  /** Only where it is certain: custom services carry none. */
  unit?: string
  points: ITariffPoint[]
}

export interface ITariffHistory {
  series: ITariffSeries[]
  /** Services listed in the month services but never priced above zero. */
  unpriced: string[]
}

export interface ITariffChange {
  /** The first month of the period that has a tariff. */
  since: string
  diff: number
  /** `null` when there is nothing to take a percentage of. */
  percent: number | null
}

type CustomRow = NonNullable<IService['customServices']>[number]

type LegacyField =
  | 'rentPrice'
  | 'electricityPrice'
  | 'waterPrice'
  | 'waterPriceTotal'
  | 'garbageCollectorPrice'
  | 'inflicionPrice'

interface ILegacyService {
  field: LegacyField
  name: string
  unit?: string
  /** Pinned catalog `_id`, see `defaultServices` in `@utils/constants`. */
  catalogId: string
  /** `fieldName`s of a custom row that stands for this field. */
  fieldNames: string[]
}

/**
 * Tariffs that have a column of their own in the `Service` model, in the order
 * of the services table. The same tariff may also be a row of
 * `customServices`: the two are one service and make one chart.
 */
const LEGACY_SERVICES: ILegacyService[] = [
  {
    field: 'rentPrice',
    name: ServiceName.maintenancePrice,
    unit: 'грн/м²',
    catalogId: '677d414283b6ef93c6b8ea2c',
    fieldNames: ['rentPrice', ServiceType.Maintenance],
  },
  {
    field: 'electricityPrice',
    name: ServiceName.electricityPrice,
    unit: 'грн/кВт',
    catalogId: '68156d2cf520914e5e1ad87c',
    fieldNames: [ServiceType.Electricity],
  },
  {
    field: 'waterPrice',
    name: ServiceName.waterPrice,
    unit: 'грн/м³',
    catalogId: '68156cdbf520914e5e1ad877',
    fieldNames: [ServiceType.Water],
  },
  {
    field: 'waterPriceTotal',
    name: ServiceName.waterPart,
    catalogId: '6816bca1e26e39a785fd7a0d',
    fieldNames: ['waterPriceTotal'],
  },
  {
    field: 'garbageCollectorPrice',
    name: ServiceName.garbageCollectorPrice,
    catalogId: '68156d58f520914e5e1ad881',
    fieldNames: [ServiceType.GarbageCollector],
  },
  {
    field: 'inflicionPrice',
    name: ServiceName.inflicionPrice,
    unit: '%',
    catalogId: '68230f76a51fddf0ae165d77',
    fieldNames: [ServiceType.Inflicion],
  },
]

// Several meters of one kind may share a `fieldName`, so the `_id` goes first.
const getRowKey = (row: CustomRow): string =>
  row._id ? String(row._id) : `field:${row.fieldName}`

/** The custom rows of one month service, by the chart each belongs to. */
const matchRows = (rows: CustomRow[]): Map<string, CustomRow> => {
  const matched = new Map<string, CustomRow>()
  let rest = rows

  const claim = (isSame: (legacy: ILegacyService, row: CustomRow) => boolean) =>
    LEGACY_SERVICES.forEach((legacy) => {
      if (matched.has(legacy.field)) return

      const found = rest.find((row) => isSame(legacy, row))
      if (!found) return

      matched.set(legacy.field, found)
      rest = rest.filter((row) => row !== found)
    })

  claim((legacy, row) => String(row._id) === legacy.catalogId)
  claim((legacy, row) => legacy.fieldNames.includes(row.fieldName))
  rest.forEach((row) => matched.set(getRowKey(row), row))

  return matched
}

/**
 * The tariff of every service found in the month services of the period, one
 * series per service. The services are expected to belong to a single address.
 */
export const buildTariffHistory = (
  services: IService[],
  period?: MonthPeriod | null
): ITariffHistory => {
  const months = getServiceMonths(services, period).map(
    ({ month, service }) => ({
      month,
      service,
      rows: matchRows(service?.customServices ?? []),
    })
  )

  const extraKeys = new Set(months.flatMap(({ rows }) => [...rows.keys()]))
  LEGACY_SERVICES.forEach(({ field }) => extraKeys.delete(field))

  const toSeries = (key: string, legacy?: ILegacyService) => {
    let label: string
    let isListed = false

    const points = months.map(({ month, service, rows }) => {
      const row = rows.get(key)
      if (row) {
        isListed = true
        label = row.label?.trim() || label
      }
      // The column defaults to 0, so a zero there says nothing by itself.
      const value =
        row?.price ||
        (legacy && service?.[legacy.field]) ||
        (row?.price === 0 ? 0 : null)

      return { month, value }
    })

    return {
      isListed,
      key,
      name: label || legacy?.name || 'Невідома послуга',
      unit: legacy?.unit,
      points,
    }
  }

  const all = [
    ...LEGACY_SERVICES.map((legacy) => toSeries(legacy.field, legacy)),
    ...[...extraKeys]
      .map((key) => toSeries(key))
      .sort((a, b) => a.name.localeCompare(b.name, 'uk')),
  ]
  const isPriced = ({ points }: ITariffSeries) =>
    points.some(({ value }) => value)

  return {
    series: all
      .filter(isPriced)
      .map(({ key, name, unit, points }) => ({ key, name, unit, points })),
    unpriced: all
      .filter((item) => item.isListed && !isPriced(item))
      .map(({ name }) => name),
  }
}

/** The latest month that has a tariff. */
export const getLatestPoint = (
  points: ITariffPoint[]
): ITariffPoint | undefined =>
  [...points].reverse().find(({ value }) => value !== null)

/** From the first tariff of the period to the latest one. */
export const getTariffChange = (
  points: ITariffPoint[]
): ITariffChange | null => {
  const known = points.filter(({ value }) => value !== null)
  if (known.length < 2) return null

  const first = known[0]
  const diff = new Big(known[known.length - 1].value).minus(first.value)

  return {
    since: first.month,
    diff: diff.toNumber(),
    percent: first.value ? diff.div(first.value).times(100).toNumber() : null,
  }
}
