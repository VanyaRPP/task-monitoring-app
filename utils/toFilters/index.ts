import { IFilter } from '@common/modules/models/Filter'
import { FilterQuery } from 'mongoose'

/**
 * Generates a set of filters from an array of objects or strings.

 * @param array - The array of objects or strings to generate filters from.
 * @returns An array of filter objects, each with `text` and `value` properties.
 */
export function toFilters(array: string[]): Array<IFilter>

/**
 * Generates a set of filters from an array of objects or strings.
 *
 * @template T - The type of the objects in the array.
 * @template K - The keys of the objects in the array.
 *
 * @param array - The array of objects or strings to generate filters from.
 * @param valueKey - The key or function to use for the filter values (optional for object arrays).
 * @param textKey - Optional key or function to use for the filter text (optional for object arrays).
 * @returns An array of filter objects, each with `text` and `value` properties.
 */
export function toFilters<T, K extends keyof T>(
  array: T[],
  valueKey?: K | ((item: T) => any),
  textKey?: K | ((item: T) => any)
): Array<IFilter>

export function toFilters<T, K extends keyof T>(
  array: T[] | string[],
  valueKey?: K | ((item: T) => any),
  textKey?: K | ((item: T) => any)
): Array<{ text: string; value: any }> {
  try {
    const filtersMap = new Map<any, { text: string; value: any }>()

    if (typeof array[0] === 'string') {
      ;(array as string[]).forEach((item) => {
        filtersMap.set(item, { text: item, value: item })
      })
    } else {
      ;(array as T[]).forEach((item) => {
        const value =
          typeof valueKey === 'function' ? valueKey(item) : item[valueKey as K]
        const text = textKey
          ? typeof textKey === 'function'
            ? textKey(item)
            : item[textKey as K]?.toString()
          : value?.toString()

        if (text && value) {
          filtersMap.set(value, { text, value })
        }
      })
    }

    return Array.from(filtersMap.values())
  } catch (error) {
    return []
  }
}

export type PeriodOptions = {
  year?: number | string | (number | string)[]
  quarter?: number | string | (number | string)[]
  month?: number | string | (number | string)[]
  day?: number | string | (number | string)[]
}

/**
 * Generates a set of period filters from an mongoose options.
 *
 * @template T - The type of the mongoose model.
 *
 * @param key - The key of field filter will be applied to.
 * @param options - The `PeriodOptions` representing `year`, `quarter`, `month`, `day` periods.
 * @returns An `FilterQuery` set that can be used to filter mongoose request with `$and` keyword.
 */
export function toPeriodFiltersQuery<T>(
  key: keyof T & string,
  options: PeriodOptions
): FilterQuery<T> | null {
  const filters: FilterQuery<T>[] = []

  if (options.year) {
    filters.push({ [key]: { $eq: new Date(options.year.toString()) } })
  }

  if (options.quarter) {
    const quarters = {
      1: [1, 2, 3],
      2: [4, 5, 6],
      3: [7, 8, 9],
      4: [10, 11, 12],
    }

    const quarterValues = Array.isArray(options.quarter)
      ? options.quarter.map(Number)
      : [Number(options.quarter)]
    const months = quarterValues.flatMap((quarter) => quarters[quarter])

    filters.push({ [key]: { $in: months } })
  }

  if (options.month) {
    filters.push({ [key]: { $eq: new Date(options.month.toString()) } })
  }

  if (options.day) {
    filters.push({ [key]: { $eq: new Date(options.day.toString()) } })
  }

  return filters.length ? { $and: filters } : null
}
