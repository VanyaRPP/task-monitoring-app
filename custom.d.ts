declare global {
  // eslint-disable-next-line no-var
  var mongoose: any
  const _mongoClientPromise: any

  interface Number {
    /**
     * Parses string to float in x.xx format
     * @param length - count of digits after comma
     * @returns float string on success or '0' on error
     */
    toRoundFixed(length?: number): string
  }
  interface String {
    /**
     * Parses string to float in x.xx format
     * @param length - count of digits after comma
     * @returns float string on success or '0' on error
     */
    toRoundFixed(length?: number): string
  }
}

export {}
