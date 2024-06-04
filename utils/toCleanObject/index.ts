/**
 * Recursively removes all properties with `null` or `undefined` values from an object or array.
 *
 * @param obj - The object or array to clean.
 * @returns A new object or array with `null` and `undefined` values removed, or `null` if the input was falsy.
 */
export function toCleanObject<T = unknown>(obj: T): Partial<T> | null {
  if (obj === undefined && obj === null) {
    return null
  }

  if (Array.isArray(obj)) {
    return obj
      .map((item) => toCleanObject(item))
      .filter((item) => item !== undefined && item !== null) as unknown as T
  }

  if (typeof obj === 'object') {
    return Object.keys(obj).reduce((acc: Partial<T>, key) => {
      const value = obj[key]

      if (value !== undefined && value !== null) {
        acc[key] = toCleanObject(value)
      }

      return acc
    }, {})
  }

  return obj
}
