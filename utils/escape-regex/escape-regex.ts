import escapeRegExp from 'lodash/escapeRegExp'

export function escapeRegexForMongo(str: string): string {
  return escapeRegExp(str)
}
