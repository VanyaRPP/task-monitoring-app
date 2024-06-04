import { IFilter } from '@common/modules/models/Filter'

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
  valueKey: K | ((item: T) => any),
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
