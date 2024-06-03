/**
 * Generates a set of filters from an array of objects by specific key.
 *
 * @template T - The type of the objects in the array.
 * @template K - The keys of the objects in the array.
 *
 * @param array - The array of objects to generate filters from.
 * @param valueKey - The key to use for the filter values.
 * @param textKey - Optional key to use for the filter text. If not provided, `valueKey` will be used.
 * @returns An array of filter objects, each with `text` and `value` properties.
 */
export function toFilters<T, K extends keyof T>(
  array: T[],
  valueKey: K,
  textKey?: K
): Array<{ text: string; value: any }> {
  const filtersMap = new Map<any, { text: string; value: any }>()

  array.forEach((item) => {
    const text = item[textKey ?? valueKey]
    const value = item[valueKey]
    if (text && value) {
      filtersMap.set(value, { text: text.toString(), value: value })
    }
  })

  return Array.from(filtersMap.values())
}
