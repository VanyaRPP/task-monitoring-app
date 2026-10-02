import type { IInflationIndexInput } from '@common/api/inflationIndexApi/inflationIndex.api.types'
import DomainInflationOverride from '@modules/models/DomainInflationOverride'
import Service from '@modules/models/Service'
import { ServiceType } from '@utils/constants'
import { findDomainIdsByServiceType } from '@utils/domain/domains-by-service-type'

export const SERVICE_TIMEZONE = 'Europe/Kyiv'

const EMPTY = [null, 0]
const emptyIndexFilter = {
  inflicionPrice: { $in: EMPTY },
  customServices: {
    $not: {
      $elemMatch: { fieldName: ServiceType.Inflicion, price: { $nin: EMPTY } },
    },
  },
}

export const inServiceMonth = (year: number, month: number) => ({
  $expr: {
    $and: [
      {
        $eq: [{ $year: { date: '$date', timezone: SERVICE_TIMEZONE } }, year],
      },
      {
        $eq: [{ $month: { date: '$date', timezone: SERVICE_TIMEZONE } }, month],
      },
    ],
  },
})

const inflationRow = {
  update: (value: number) => ({
    $set: { 'customServices.$[entry].price': value },
  }),
  options: { arrayFilters: [{ 'entry.fieldName': ServiceType.Inflicion }] },
}

const fillEmpty = async (
  domainIds: unknown[],
  year: number,
  month: number,
  value: number
): Promise<number> => {
  if (domainIds.length === 0) return 0

  const targets = await Service.find(
    {
      domain: { $in: domainIds },
      ...emptyIndexFilter,
      ...inServiceMonth(year, month),
    },
    '_id'
  ).lean()
  if (targets.length === 0) return 0

  const ids = targets.map(({ _id }) => _id)

  await Service.updateMany(
    {
      _id: { $in: ids },
      ...emptyIndexFilter,
      'customServices.fieldName': ServiceType.Inflicion,
    },
    inflationRow.update(value),
    inflationRow.options
  )

  const { modifiedCount } = await Service.updateMany(
    { _id: { $in: ids }, inflicionPrice: { $in: EMPTY } },
    { $set: { inflicionPrice: value } }
  )

  return modifiedCount
}

export async function fillServicesInflation({
  year,
  month,
  value,
}: IInflationIndexInput): Promise<number> {
  const domainIds = await findDomainIdsByServiceType(ServiceType.Inflicion)
  if (domainIds.length === 0) return 0

  const overrides = await DomainInflationOverride.find(
    { domain: { $in: domainIds }, year, month },
    'domain value'
  ).lean()
  const overridden = new Map(
    overrides.map((item) => [String(item.domain), item.value])
  )

  let filled = await fillEmpty(
    domainIds.filter((id) => !overridden.has(id)),
    year,
    month,
    value
  )
  for (const [domainId, domainValue] of overridden) {
    filled += await fillEmpty([domainId], year, month, domainValue)
  }

  return filled
}

export async function writeServicesIndex(
  domainId: string,
  year: number,
  month: number,
  value: number
): Promise<number> {
  const inMonth = { domain: domainId, ...inServiceMonth(year, month) }

  await Service.updateMany(
    { ...inMonth, 'customServices.fieldName': ServiceType.Inflicion },
    inflationRow.update(value),
    inflationRow.options
  )

  const { matchedCount } = await Service.updateMany(inMonth, {
    $set: { inflicionPrice: value },
  })

  return matchedCount
}
