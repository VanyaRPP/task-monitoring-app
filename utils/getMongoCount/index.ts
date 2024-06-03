import { FilterQuery, Model } from 'mongoose'

/**
 * Retrieves the count of documents in a MongoDB collection based on a specified filter.
 *
 * @template T - The type of the documents in the collection.
 * @param model - The Mongoose model representing the collection.
 * @param filter - The filter object to match documents.
 * @returns A promise that resolves to the count of documents matching the filter.
 */
export async function getMongoCount<T = unknown>(
  model: Model<T>,
  filter: FilterQuery<T>
): Promise<number> {
  const result = await model.aggregate([
    { $match: filter },
    { $count: 'totalCount' },
  ])

  return result.length > 0 ? result[0].totalCount : 0
}
