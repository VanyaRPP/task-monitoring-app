export const formatValue = (value: number | null): string =>
  value === null
    ? '—'
    : value.toLocaleString('uk-UA', { maximumFractionDigits: 2 })

const compact = new Intl.NumberFormat('uk-UA', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** Axis ticks get little room: 250000 reads as "250 тис.". */
export const formatAxisValue = (value: number): string =>
  Math.abs(value) >= 10_000 ? compact.format(value) : formatValue(Number(value))
