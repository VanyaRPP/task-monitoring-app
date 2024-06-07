/**
 * @returns decoded URI component's array or `null`
 */
export function toQuery(query: string[] | string): string[] | null {
  return query
    ? typeof query === 'string'
      ? query.split(',').map((id) => decodeURIComponent(id))
      : query.map((id) => decodeURIComponent(id))
    : null
}
