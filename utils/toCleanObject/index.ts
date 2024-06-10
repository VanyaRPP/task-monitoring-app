/**
 * Recursively removes all properties with `null` or `undefined` values from an object or array.
 * Also removes empty objects and arrays.
 *
 * @param obj - The object or array to clean.
 * @returns A new object or array with `null`, `undefined`, and empty values removed, or `null` if the input was falsy.
 */
export function toCleanObject<T = unknown>(obj: T): Partial<T> | null {
  if (obj === undefined || obj === null) {
    return null
  }

  if (Array.isArray(obj)) {
    const cleanedArray = obj
      .map((item) => toCleanObject(item))
      .filter((item) => item !== undefined && item !== null)

    return cleanedArray.length > 0 ? (cleanedArray as unknown as T) : null
  }

  if (typeof obj === 'object' && obj !== null) {
    const cleanedObject = Object.keys(obj).reduce((acc: Partial<T>, key) => {
      const value = obj[key]

      const cleanedValue = toCleanObject(value)

      if (cleanedValue !== undefined && cleanedValue !== null) {
        acc[key] = cleanedValue
      }

      return acc
    }, {})

    return Object.keys(cleanedObject).length > 0 ? cleanedObject : null
  }

  return obj
}
