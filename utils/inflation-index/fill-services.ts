import type { IInflationIndexInput } from '@common/api/inflationIndexApi/inflationIndex.api.types'
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

export async function fillServicesInflation({
  year,
  month,
  value,
}: IInflationIndexInput): Promise<number> {
  const domainIds = await findDomainIdsByServiceType(ServiceType.Inflicion)
  if (domainIds.length === 0) return 0

  const targets = await Service.find(
    {
      domain: { $in: domainIds },
      ...emptyIndexFilter,
      $expr: {
        $and: [
          {
            $eq: [
              { $year: { date: '$date', timezone: SERVICE_TIMEZONE } },
              year,
            ],
          },
          {
            $eq: [
              { $month: { date: '$date', timezone: SERVICE_TIMEZONE } },
              month,
            ],
          },
        ],
      },
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
    { $set: { 'customServices.$[entry].price': value } },
    { arrayFilters: [{ 'entry.fieldName': ServiceType.Inflicion }] }
  )

  const { modifiedCount } = await Service.updateMany(
    { _id: { $in: ids }, inflicionPrice: { $in: EMPTY } },
    { $set: { inflicionPrice: value } }
  )

  return modifiedCount
}
