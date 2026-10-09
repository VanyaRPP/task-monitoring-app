import type { IInflationIndexInput } from '@common/api/inflationIndexApi/inflationIndex.api.types'
import InflationIndex from '@modules/models/InflationIndex'

export async function insertMissingIndexes(
  items: IInflationIndexInput[]
): Promise<IInflationIndexInput[]> {
  if (items.length === 0) return []

  const result = await InflationIndex.bulkWrite(
    items.map(({ year, month, value }) => ({
      updateOne: {
        filter: { year, month },
        update: { $setOnInsert: { value, source: 'auto' } },
        upsert: true,
      },
    }))
  )

  return Object.keys(result.upsertedIds).map((i) => items[Number(i)])
}
